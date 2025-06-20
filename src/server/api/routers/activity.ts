import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { type CAMPSITES } from "~/app/components/Select";
import {
  type MustSeeActivity,
  type LocalActivity,
  type CampsiteActivity,
} from "~/server/db/schema";
import { fetchSiteMetadata } from "~/lib/metadata";

const addOneDay = (date: Date) => {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result;
};

// Define time ranges for different parts of the day
const TIME_SLOTS = {
  morning: { start: "06:00:00", end: "11:59:59" },
  afternoon: { start: "12:00:00", end: "17:59:59" },
  evening: { start: "18:00:00", end: "05:59:59" }, // Evening wraps to early morning
};

// Helper function to determine time slot for an activity
const getTimeSlot = (activity: { Contenu_time?: string | null }) => {
  // Ensure Contenu_time is string before splitting
  const timeStr = activity.Contenu_time ?? "";
  const hour = timeStr ? parseInt(timeStr.split(":")[0] ?? "12", 10) : 12;

  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
};

// Helper function to parse hour safely
const safeParseInt = (
  value: string | undefined | null,
  defaultValue = 0,
): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to check if an activity fits within a time slot based on opening/closing times
const activityFitsTimeSlot = (
  activity: { opening_time?: string | null; closing_time?: string | null },
  slot: keyof typeof TIME_SLOTS,
) => {
  if (!activity.opening_time || !activity.closing_time) {
    return true; // If no opening/closing times specified, assume it fits
  }

  const slotTime = TIME_SLOTS[slot];

  // Convert times to comparable format (hours as numbers)
  const opening = activity.opening_time.split(":")[0] ?? "9"; // Default to 9am if parsing fails
  const closing = activity.closing_time.split(":")[0] ?? "17"; // Default to 5pm if parsing fails
  const slotStart = slotTime.start.split(":")[0];
  const slotEnd = slotTime.end.split(":")[0];

  // Parse hours safely
  const openingHour = safeParseInt(opening, 9);
  const closingHour = safeParseInt(closing, 17);
  const slotStartHour = safeParseInt(slotStart, 6);
  const slotEndHour = safeParseInt(slotEnd, 18);

  // Handle evening case which crosses midnight
  if (slot === "evening") {
    // Either: opens before midnight and is still open in evening time slot
    // Or: opens after midnight but before end of evening slot
    return openingHour >= 18 || (openingHour < 6 && closingHour > openingHour);
  }

  // For morning and afternoon, simply check if the opening time falls within the slot
  return openingHour >= slotStartHour && openingHour < slotEndHour;
};

// Type for activities with their specific type
type ScheduleActivity =
  | (MustSeeActivity & { type: "must-see" })
  | (LocalActivity & { type: "local" })
  | (CampsiteActivity & { type: "campsite" });

// Type for a day's schedule
export interface DaySchedule {
  date: Date;
  morning: ScheduleActivity | null;
  afternoon: ScheduleActivity | null;
  evening: ScheduleActivity | null;
}

export const activityRouter = createTRPCRouter({
  getCampsites: publicProcedure.query(async ({ ctx }) => {
    try {
      // Get distinct campsite names from all activity tables
      const result = await ctx.db.execute(
        sql`
        SELECT "Campings" FROM (
          SELECT DISTINCT "Campings" FROM "planicamping_campsite_activity"
          UNION
          SELECT DISTINCT "Campings" FROM "planicamping_must_see_activity"
          UNION
          SELECT DISTINCT "Campings" FROM "planicamping_local_activity"
        ) AS all_campings
        ORDER BY "Campings" ASC
        `,
      );

      // Safely access the result data
      const campsites: string[] = [];
      if (result && Array.isArray(result)) {
        for (const row of result) {
          if (
            row &&
            typeof row === "object" &&
            "Campings" in row &&
            typeof row.Campings === "string"
          ) {
            campsites.push(row.Campings);
          }
        }
      }

      return campsites;
    } catch (err) {
      console.error("Failed to fetch campsites:", err);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch campsites",
      });
    }
  }),
  getActivitiesForSiteAndDay: publicProcedure
    .input(z.object({ site: z.string(), day: z.date() }))
    .query(async ({ ctx, input }) => {
      const { site, day } = input;

      try {
        const activities = await ctx.db.query.campsiteActivities.findMany({
          where: (activity, { and, eq }) =>
            and(
              eq(activity.Campings, site as CAMPSITES),
              eq(activity.Contenu_date, day),
            ),
        });

        if (!activities) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No activities found",
          });
        }

        return activities;
      } catch (err) {
        console.error(err);
        throw err;
      }
    }),
  getActivitiesForSiteAndDateRange: publicProcedure
    .input(
      z.object({
        site: z.string(),
        dateRange: z.object({
          from: z.date(),
          to: z.date(),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { site, dateRange } = input;

      try {
        const activities = await ctx.db.query.campsiteActivities.findMany({
          where: (activity, { eq, and, between }) =>
            and(
              eq(activity.Campings, site as CAMPSITES),
              between(
                activity.Contenu_date,
                dateRange.from,
                addOneDay(dateRange.to),
              ),
            ),
        });

        if (!activities) {
          console.log("error");

          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No activities found",
          });
        }

        return activities;
      } catch (err) {
        console.error(err);
        throw err;
      }
    }),
  getDaysWithActivitiesForSite: publicProcedure
    .input(z.object({ site: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const activitiesForSite =
          await ctx.db.query.campsiteActivities.findMany({
            where: (activity, { eq }) =>
              eq(activity.Campings, input.site as CAMPSITES),
          });

        const dates = activitiesForSite.map(
          (activity) => activity.Contenu_date,
        );

        if (!activitiesForSite) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No activities found for this site",
          });
        }

        return dates;
      } catch (err) {
        console.error(err);
        throw err;
      }
    }),
  getDaysWithActivitiesForSiteAndDateRange: publicProcedure
    .input(
      z.object({
        site: z.string(),
        range: z.object({ from: z.date().optional(), to: z.date().optional() }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { range } = input;

      try {
        const activities = await ctx.db.query.campsiteActivities.findMany({
          where: (activity, { and, eq, between }) =>
            range.from && range.to
              ? and(
                  eq(activity.Campings, input.site as CAMPSITES),
                  between(
                    activity.Contenu_date,
                    range.from,
                    addOneDay(range.to),
                  ),
                )
              : eq(activity.Campings, input.site as CAMPSITES),
        });

        // Extract dates from activities
        const dates = activities.map((activity) => activity.Contenu_date);

        // Deduplicate dates by comparing timestamps
        const uniqueDates = dates.filter(
          (date, index, self) =>
            index === self.findIndex((d) => d.getTime() === date.getTime()),
        );

        if (!activities) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No activities found",
          });
        }
        return uniqueDates;
      } catch (err) {
        console.error(err);
        throw err;
      }
    }),
  getSpecificActivitiesForSiteAndDateRange: publicProcedure
    .input(
      z.object({
        site: z.string(),
        dateRange: z.object({
          from: z.date(),
          to: z.date(),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { site, dateRange } = input;

      try {
        const activities = await ctx.db.query.campsiteActivities.findMany({
          where: (activity, { eq, and, between }) =>
            and(
              eq(activity.Campings, site as CAMPSITES),
              between(activity.Contenu_date, dateRange.from, dateRange.to),
            ),
        });

        if (!activities) {
          console.log("error");

          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No activities found",
          });
        }

        return activities;
      } catch (err) {
        console.error(err);
        throw err;
      }
    }),
  getMustSeeActivities: publicProcedure
    .input(
      z.object({
        site: z.string(),
        scheduledActivityIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { site, scheduledActivityIds = [] } = input;

        const activities = await ctx.db.query.mustSeeActivities.findMany({
          where: (activity, { eq, and, notInArray }) =>
            scheduledActivityIds.length
              ? and(
                  eq(activity.Campings, site as CAMPSITES),
                  notInArray(activity.ID, scheduledActivityIds),
                )
              : eq(activity.Campings, site as CAMPSITES),
        });

        return activities;
      } catch (err) {
        console.error("Error fetching must-see activities:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch must-see activities",
        });
      }
    }),
  getLocalActivities: publicProcedure
    .input(
      z.object({
        site: z.string(),
        category: z.string().optional(),
        scheduledActivityIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { site, category, scheduledActivityIds = [] } = input;

        const activities = await ctx.db.query.localActivities.findMany({
          where: (activity, { and, eq, notInArray }) => {
            const conditions = [];

            conditions.push(eq(activity.Campings, site as CAMPSITES));

            if (category) {
              conditions.push(eq(activity.Category, category));
            }

            if (scheduledActivityIds.length > 0) {
              conditions.push(notInArray(activity.ID, scheduledActivityIds));
            }

            return and(...conditions);
          },
        });

        return activities;
      } catch (err) {
        console.error("Error fetching local activities:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch local activities",
        });
      }
    }),
  getLocalActivityCategories: publicProcedure
    .input(z.object({ site: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.execute(
          sql`SELECT DISTINCT "Category" FROM "planicamping_local_activity" 
              WHERE "Campings" = ${input.site} AND "Category" IS NOT NULL
              ORDER BY "Category" ASC`,
        );

        // Safely access the result data
        const categories: string[] = [];
        if (result && Array.isArray(result)) {
          for (const row of result) {
            if (
              row &&
              typeof row === "object" &&
              "Category" in row &&
              typeof row.Category === "string"
            ) {
              categories.push(row.Category);
            }
          }
        }

        return categories;
      } catch (err) {
        console.error("Error fetching activity categories:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch activity categories",
        });
      }
    }),
  // New procedure to generate a schedule
  generateSchedule: publicProcedure
    .input(
      z.object({
        site: z.string(),
        dateRange: z.object({
          from: z.date(),
          to: z.date(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { site, dateRange } = input;

      try {
        // Fetch all activity types we need
        const mustSeeActivities = await ctx.db.query.mustSeeActivities.findMany(
          {
            where: (activity, { eq }) =>
              eq(activity.Campings, site as CAMPSITES),
          },
        );

        const localActivities = await ctx.db.query.localActivities.findMany({
          where: (activity, { eq }) => eq(activity.Campings, site as CAMPSITES),
        });

        const campsiteActivities =
          await ctx.db.query.campsiteActivities.findMany({
            where: (activity, { eq, and, between }) =>
              and(
                eq(activity.Campings, site as CAMPSITES),
                between(
                  activity.Contenu_date,
                  dateRange.from,
                  addOneDay(dateRange.to),
                ),
              ),
          });

        // Create a date range from start to end date
        const dates: Date[] = [];
        const currentDate = new Date(dateRange.from);
        const endDate = new Date(dateRange.to);

        while (currentDate <= endDate) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Store the generated schedule
        const generatedSchedule: DaySchedule[] = [];
        // Keep track of used activity IDs to avoid duplication
        const usedMustSeeIds = new Set<number>();
        const usedLocalIds = new Set<number>();

        // For each day in the range, schedule activities
        for (const day of dates) {
          const daySchedule: DaySchedule = {
            date: day,
            morning: null,
            afternoon: null,
            evening: null,
          };

          // Filter campsite activities for this day
          const dayActivities = campsiteActivities.filter((activity) => {
            const activityDate = new Date(activity.Contenu_date);
            return (
              activityDate.getDate() === day.getDate() &&
              activityDate.getMonth() === day.getMonth() &&
              activityDate.getFullYear() === day.getFullYear()
            );
          });

          // Filter must-see activities to exclude those already used
          const availableMustSeeActivities = mustSeeActivities.filter(
            (activity) => !usedMustSeeIds.has(activity.ID),
          );

          // Filter local activities to exclude those already used
          const availableLocalActivities = localActivities.filter(
            (activity) => !usedLocalIds.has(activity.ID),
          );

          // Group must-see activities by time slot suitability
          const mustSeeByTimeSlot = {
            morning: availableMustSeeActivities.filter((act) =>
              activityFitsTimeSlot(act, "morning"),
            ),
            afternoon: availableMustSeeActivities.filter((act) =>
              activityFitsTimeSlot(act, "afternoon"),
            ),
            evening: availableMustSeeActivities.filter((act) =>
              activityFitsTimeSlot(act, "evening"),
            ),
          };

          // Group local activities by time slot suitability
          const localByTimeSlot = {
            morning: availableLocalActivities.filter((act) =>
              activityFitsTimeSlot(act, "morning"),
            ),
            afternoon: availableLocalActivities.filter((act) =>
              activityFitsTimeSlot(act, "afternoon"),
            ),
            evening: availableLocalActivities.filter((act) =>
              activityFitsTimeSlot(act, "evening"),
            ),
          };

          // Helper function to assign an activity to a slot
          const assignMustSeeActivity = (
            slot: keyof Omit<DaySchedule, "date">,
            activity: MustSeeActivity,
          ) => {
            daySchedule[slot] = {
              ...activity,
              type: "must-see" as const,
            };
            usedMustSeeIds.add(activity.ID);
          };

          const assignLocalActivity = (
            slot: keyof Omit<DaySchedule, "date">,
            activity: LocalActivity,
          ) => {
            daySchedule[slot] = {
              ...activity,
              type: "local" as const,
            };
            usedLocalIds.add(activity.ID);
          };

          const assignCampsiteActivity = (
            slot: keyof Omit<DaySchedule, "date">,
            activity: CampsiteActivity,
          ) => {
            daySchedule[slot] = {
              ...activity,
              type: "campsite" as const,
            };
          };

          // Helper function to get random activity from array
          const getRandomLocalActivity = (activities: LocalActivity[]) => {
            if (activities.length === 0) return null;
            const randomIndex = Math.floor(Math.random() * activities.length);
            return activities[randomIndex] ?? null;
          };

          const getRandomMustSeeActivity = (activities: MustSeeActivity[]) => {
            if (activities.length === 0) return null;
            const randomIndex = Math.floor(Math.random() * activities.length);
            return activities[randomIndex] ?? null;
          };

          const getRandomCampsiteActivity = (
            activities: CampsiteActivity[],
          ) => {
            if (activities.length === 0) return null;
            const randomIndex = Math.floor(Math.random() * activities.length);
            return activities[randomIndex] ?? null;
          };

          // Morning scheduling: Priority 1: local, Priority 2: campsite, Priority 3: must-see
          if (!daySchedule.morning) {
            const localActivity = getRandomLocalActivity(
              localByTimeSlot.morning,
            );
            if (localActivity) {
              assignLocalActivity("morning", localActivity);
            } else {
              const campsiteActivities = dayActivities.filter(
                (activity) => getTimeSlot(activity) === "morning",
              );
              const campsiteActivity =
                getRandomCampsiteActivity(campsiteActivities);
              if (campsiteActivity) {
                assignCampsiteActivity("morning", campsiteActivity);
              } else {
                const mustSeeActivity = getRandomMustSeeActivity(
                  mustSeeByTimeSlot.morning,
                );
                if (mustSeeActivity) {
                  assignMustSeeActivity("morning", mustSeeActivity);
                }
              }
            }
          }

          // Afternoon scheduling: Priority 1: local, Priority 2: must-see, Priority 3: campsite
          if (!daySchedule.afternoon) {
            const localActivity = getRandomLocalActivity(
              localByTimeSlot.afternoon,
            );
            if (localActivity) {
              assignLocalActivity("afternoon", localActivity);
            } else {
              const mustSeeActivity = getRandomMustSeeActivity(
                mustSeeByTimeSlot.afternoon,
              );
              if (mustSeeActivity) {
                assignMustSeeActivity("afternoon", mustSeeActivity);
              } else {
                const campsiteActivities = dayActivities.filter(
                  (activity) => getTimeSlot(activity) === "afternoon",
                );
                const campsiteActivity =
                  getRandomCampsiteActivity(campsiteActivities);
                if (campsiteActivity) {
                  assignCampsiteActivity("afternoon", campsiteActivity);
                }
              }
            }
          }

          // Evening scheduling: Priority 1: campsite, Priority 2: local, Priority 3: must-see
          if (!daySchedule.evening) {
            const campsiteActivities = dayActivities.filter(
              (activity) => getTimeSlot(activity) === "evening",
            );
            const campsiteActivity =
              getRandomCampsiteActivity(campsiteActivities);
            if (campsiteActivity) {
              assignCampsiteActivity("evening", campsiteActivity);
            } else {
              const localActivity = getRandomLocalActivity(
                localByTimeSlot.evening,
              );
              if (localActivity) {
                assignLocalActivity("evening", localActivity);
              } else {
                const mustSeeActivity = getRandomMustSeeActivity(
                  mustSeeByTimeSlot.evening,
                );
                if (mustSeeActivity) {
                  assignMustSeeActivity("evening", mustSeeActivity);
                }
              }
            }
          }

          // Add this day's schedule to the overall schedule
          generatedSchedule.push(daySchedule);
        }

        return generatedSchedule;
      } catch (err) {
        console.error("Error generating schedule:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate schedule",
        });
      }
    }),
  fetchSiteMetadata: publicProcedure
    .input(z.object({ url: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { url } = input;

      try {
        const metadata = await fetchSiteMetadata(url);
        return metadata;
      } catch (err) {
        console.error("Error fetching site metadata:", err);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch site metadata",
        });
      }
    }),
});

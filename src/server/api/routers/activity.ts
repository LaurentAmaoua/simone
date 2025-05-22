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

const addOneDay = (date: Date) => {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result;
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

// Type for activities with their specific type
type ScheduleActivity =
  | (MustSeeActivity & { type: "must-see" })
  | (LocalActivity & { type: "local" })
  | (CampsiteActivity & { type: "campsite" });

// Type for a day's schedule
interface DaySchedule {
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
    .input(z.object({ site: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const activities = await ctx.db.query.mustSeeActivities.findMany({
          where: (activity, { eq }) =>
            eq(activity.Campings, input.site as CAMPSITES),
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
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const { site, category } = input;

        const activities = await ctx.db.query.localActivities.findMany({
          where: (activity, { and, eq }) =>
            category
              ? and(
                  eq(activity.Campings, site as CAMPSITES),
                  eq(activity.Category, category),
                )
              : eq(activity.Campings, site as CAMPSITES),
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

          // Step 1: Try to fill with must-see activities first
          if (mustSeeActivities.length > 0) {
            // Randomly select up to 3 must-see activities
            const shuffledMustSee = [...mustSeeActivities].sort(
              () => 0.5 - Math.random(),
            );

            // Try to assign one to each time slot
            const timeSlots: (keyof Omit<DaySchedule, "date">)[] = [
              "morning",
              "afternoon",
              "evening",
            ];
            timeSlots.forEach((slot, index) => {
              if (shuffledMustSee[index]) {
                daySchedule[slot] = {
                  ...shuffledMustSee[index],
                  type: "must-see" as const,
                };
              }
            });
          }

          // Step 2: For any empty slots, try to fill with local activities
          if (localActivities.length > 0) {
            const shuffledLocal = [...localActivities].sort(
              () => 0.5 - Math.random(),
            );

            const timeSlots: (keyof Omit<DaySchedule, "date">)[] = [
              "morning",
              "afternoon",
              "evening",
            ];
            timeSlots.forEach((slot) => {
              if (!daySchedule[slot] && shuffledLocal.length > 0) {
                // Pick the first available local activity
                const localActivity = shuffledLocal.shift();
                if (localActivity) {
                  daySchedule[slot] = {
                    ...localActivity,
                    type: "local" as const,
                  };
                }
              }
            });
          }

          // Step 3: Fill any remaining slots with campsite activities
          const timeSlots: (keyof Omit<DaySchedule, "date">)[] = [
            "morning",
            "afternoon",
            "evening",
          ];
          timeSlots.forEach((slot) => {
            if (!daySchedule[slot]) {
              // Find a campsite activity for this time slot
              const availableActivities = dayActivities.filter(
                (activity) => getTimeSlot(activity) === slot,
              );

              if (availableActivities.length > 0) {
                // Pick a random activity for this slot
                const randomIndex = Math.floor(
                  Math.random() * availableActivities.length,
                );
                const selectedActivity = availableActivities[randomIndex];

                if (selectedActivity) {
                  daySchedule[slot] = {
                    ...selectedActivity,
                    type: "campsite" as const,
                  };
                }
              }
            }
          });

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
});

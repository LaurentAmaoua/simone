import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { sql } from "drizzle-orm";

const addOneDay = (date: Date) => {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result;
};

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
            and(eq(activity.Campings, site), eq(activity.Contenu_date, day)),
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
              eq(activity.Campings, site),
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
            where: (activity, { eq }) => eq(activity.Campings, input.site),
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
                  eq(activity.Campings, input.site),
                  between(
                    activity.Contenu_date,
                    range.from,
                    addOneDay(range.to),
                  ),
                )
              : eq(activity.Campings, input.site),
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
              eq(activity.Campings, site),
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
          where: (activity, { eq }) => eq(activity.Campings, input.site),
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
                  eq(activity.Campings, site),
                  eq(activity.Category, category),
                )
              : eq(activity.Campings, site),
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
});

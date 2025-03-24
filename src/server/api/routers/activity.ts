import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type CAMPSITES } from "~/app/components/Select";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const addOneDay = (date: Date) => {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result;
};

export const activityRouter = createTRPCRouter({
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
});

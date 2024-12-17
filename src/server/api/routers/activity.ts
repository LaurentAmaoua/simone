import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { ACTIVITY_KIND } from "~/app/components/Activities";
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
        const activities = await ctx.db.query.activities.findMany({
          where: (activity, { and, eq }) =>
            and(
              eq(activity.locatedAt, site as CAMPSITES),
              eq(activity.startDate, day),
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
        const activities = await ctx.db.query.activities.findMany({
          where: (activity, { eq, and, between }) =>
            and(
              eq(activity.locatedAt, site as CAMPSITES),
              between(
                activity.startDate,
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
        const activitiesForSite = await ctx.db.query.activities.findMany({
          where: (activity, { and, or, eq }) =>
            and(
              eq(activity.locatedAt, input.site as CAMPSITES),
              or(
                eq(activity.kind, ACTIVITY_KIND.OFF_SITE),
                eq(activity.kind, ACTIVITY_KIND.ON_SITE_SPECIFIC),
              ),
            ),
        });

        const dates = activitiesForSite.map((activity) => activity.startDate);

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
        const activities = await ctx.db.query.activities.findMany({
          where: (activity, { or, and, eq, between }) =>
            range.from && range.to
              ? and(
                  eq(activity.locatedAt, input.site as CAMPSITES),
                  // I wish there was a simpler way to include the last day in the range
                  between(activity.startDate, range.from, addOneDay(range.to)),
                  or(
                    eq(activity.kind, ACTIVITY_KIND.OFF_SITE),
                    eq(activity.kind, ACTIVITY_KIND.ON_SITE_SPECIFIC),
                  ),
                )
              : and(
                  eq(activity.locatedAt, input.site as CAMPSITES),

                  eq(activity.kind, ACTIVITY_KIND.ON_SITE_GENERIC),
                ),
        });

        const dates = activities.map((activity) => activity.startDate);

        if (!activities) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No activities found",
          });
        }

        return dates;
      } catch (err) {
        console.error(err);
        throw err;
      }
    }),

  getGenericActivitiesForSite: publicProcedure
    .input(z.object({ site: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const activitiesForSite = await ctx.db.query.activities.findMany({
          where: (activity, { and, or, eq }) =>
            and(
              eq(activity.locatedAt, input.site as CAMPSITES),
              eq(activity.kind, ACTIVITY_KIND.ON_SITE_GENERIC),
            ),
        });

        if (!activitiesForSite) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No activities found for this site",
          });
        }

        return activitiesForSite;
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
        const activities = await ctx.db.query.activities.findMany({
          where: (activity, { eq, and, between }) =>
            and(
              eq(activity.locatedAt, site as CAMPSITES),
              between(activity.startDate, dateRange.from, dateRange.to),
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

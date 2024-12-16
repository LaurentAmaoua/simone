import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { ACTIVITY_KIND } from "~/app/components/Activities";
import { type CAMPSITES } from "~/app/components/Select";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const activityRouter = createTRPCRouter({
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

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type CAMPSITES } from "~/app/_components/Select";
import { TRPCError } from "@trpc/server";
import { format } from "date-fns";
import { z } from "zod";
import { ACTIVITY_KIND } from "~/app/_components/Activities";

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
  getActivitiesForSiteAndDate: publicProcedure
    .input(z.object({ site: z.string(), date: z.string().date().optional() }))
    .query(async ({ ctx, input }) => {
      const { site, date } = input;

      const formattedDate = date && format(date, "yyyy-MM-dd");

      try {
        const activities = await ctx.db.query.activities.findMany({
          where: (activity, { eq, and, or }) =>
            and(
              eq(activity.locatedAt, site as CAMPSITES),
              or(
                formattedDate
                  ? eq(activity.startDate, new Date(formattedDate))
                  : undefined,
                eq(activity.kind, ACTIVITY_KIND.ON_SITE_GENERIC),
              ),
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
});

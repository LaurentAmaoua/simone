import { type TRPCClientErrorLike } from "@trpc/client";
import { type Activity } from "~/server/db/schema";
import { type AppRouter } from "~/server/api/root";
import { type DateRange } from "react-day-picker";
import { useMemo } from "react";

import styles from "./styles/Activities.module.css";
import { formatToFrenchDate } from "~/lib/date";
import { api } from "~/trpc/react";
import { skipToken } from "@tanstack/react-query";
import { CAMPSITES } from "./Select";

export enum ACTIVITY_KIND {
  OFF_SITE = "OFF_SITE",
  ON_SITE_SPECIFIC = "ON_SITE_SPECIFIC",
  ON_SITE_GENERIC = "ON_SITE_GENERIC",
}

interface ActivitiesProps {
  activities: Activity[] | undefined;
  error: TRPCClientErrorLike<AppRouter> | null;
  site: CAMPSITES | undefined;
  isLoading: boolean;
  dateRange: DateRange | undefined;
}

export const Activities = ({
  activities,
  site,
  dateRange,
  error,
  isLoading,
}: ActivitiesProps) => {
  const { data: daysWithActivities } =
    api.activity.getDaysWithActivitiesForSiteAndDateRange.useQuery(
      site && dateRange?.from && dateRange?.to
        ? {
            site,
            range: { from: dateRange.from, to: dateRange.to },
          }
        : skipToken,
      { enabled: !!dateRange },
    );
  // const specificOffSiteActivities = useMemo(
  //   () =>
  //     specificActivities?.filter(
  //       (activity) => activity.kind === ACTIVITY_KIND.OFF_SITE,
  //     ),
  //   [specificActivities],
  // );
  // const specificOnSiteActivities = useMemo(
  //   () =>
  //     specificActivities?.filter(
  //       (activity) => activity.kind === ACTIVITY_KIND.ON_SITE_SPECIFIC,
  //     ),
  //   [specificActivities],
  // );

  if (isLoading) {
    return (
      <div className={styles.container}>
        <p>Chargement des activités en cours...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <p>Aucune activité trouvée pour ce site à cette date</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {daysWithActivities?.map((day) => (
        <div key={day.toDateString()} className={styles.day}>
          <h2>{formatToFrenchDate(day)}</h2>
          <div className={styles.blah}>
            {activities
              ?.filter(
                (activity) =>
                  activity.kind !== ACTIVITY_KIND.ON_SITE_GENERIC &&
                  activity.startDate.toDateString() === day.toDateString(),
              )
              .sort((a, b) =>
                a.startDate
                  .toISOString()
                  .localeCompare(b.startDate.toISOString()),
              )
              .map((activity) => (
                <Activity key={activity.id} activity={activity} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const Activity = ({ activity }: { activity: Activity }) => {
  return (
    <a href={activity.url} className={styles.activity}>
      <h3 className={styles.activityTitle}></h3>
      <p>{activity.kind}</p>
      <p>{activity.name}</p>
      <p>{getTimes(activity.startDate, activity.endDate)}</p>
      <p>{activity.locatedAt}</p>
      <p>{activity.description}</p>
    </a>
  );
};

const filterMorningActivities = (activity: Activity) => {
  const startDate = new Date(activity.startDate);
  return startDate.getHours() < 12;
};

const filterAfternoonActivities = (activity: Activity) => {
  const startDate = new Date(activity.startDate);
  return startDate.getHours() >= 12 && startDate.getHours() < 18;
};

const eveningActivities = (activity: Activity) => {
  const startDate = new Date(activity.startDate);
  return startDate.getHours() >= 18;
};

const getTime = (date: Date) => {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTimes = (startDate: Date, endDate: Date) => {
  return `${getTime(startDate)} - ${getTime(endDate)}`;
};

const getDuration = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return `${getTime(start)} - ${getTime(end)}`;
};

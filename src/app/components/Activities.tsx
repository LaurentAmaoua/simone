import { type Activity } from "~/server/db/schema";
import { type DateRange } from "react-day-picker";
import { skipToken } from "@tanstack/react-query";
import { formatToFrenchDate } from "~/lib/date";
import { type CAMPSITES } from "./Select";
import { api } from "~/trpc/react";

import styles from "./styles/Activities.module.css";

export enum ACTIVITY_KIND {
  OFF_SITE = "OFF_SITE",
  ON_SITE_SPECIFIC = "ON_SITE_SPECIFIC",
  ON_SITE_GENERIC = "ON_SITE_GENERIC",
}

interface ActivitiesProps {
  site: CAMPSITES | undefined;
  dateRange: DateRange | undefined;
}

export const Activities = ({ site, dateRange }: ActivitiesProps) => {
  const {
    data: daysWithActivities,
    isLoading,
    error,
  } = api.activity.getDaysWithActivitiesForSiteAndDateRange.useQuery(
    site && dateRange?.from && dateRange?.to
      ? {
          site,
          range: { from: dateRange.from, to: dateRange.to },
        }
      : skipToken,
    { enabled: !!dateRange },
  );

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
        <div key={day.toDateString()}>
          <h2 className={styles.day}>{formatToFrenchDate(day)}</h2>
          <div className={styles.dayActivities}>
            {site && <MorningActivity site={site} day={day} />}
            {site && <AfternoonActivity site={site} day={day} />}
            {site && <EveningActivity site={site} day={day} />}
          </div>
        </div>
      ))}
    </div>
  );
};

const Activity = ({ activity }: { activity: Activity }) => {
  return (
    <a href={activity.url} className={styles.activity}>
      <h3 className={styles.activityTitle}>{activity.name}</h3>
      <p>{getTimes(activity.startDate, activity.endDate)}</p>
      <p>{activity.description}</p>
    </a>
  );
};

const MorningActivity = ({ site, day }: { site: CAMPSITES; day: Date }) => {
  const {
    data: activities,
    isLoading,
    error,
  } = api.activity.getActivitiesForSiteAndDay.useQuery({
    site,
    day,
  });
  const morningActivities = activities?.filter(filterMorningActivities);

  if (isLoading) {
    return <p>Chargement des activités en cours...</p>;
  }

  if (error) {
    return <p>Une erreur est survenue lors du chargement des activités</p>;
  }
  return (
    <>
      <h3 className={styles.period}>Matin</h3>
      {morningActivities?.length ? (
        morningActivities.map((activity) => (
          <Activity key={activity.id} activity={activity} />
        ))
      ) : (
        <p className={styles.activity}>
          Aucune activité trouvée pour ce site à cette date
        </p>
      )}
    </>
  );
};

const AfternoonActivity = ({ site, day }: { site: CAMPSITES; day: Date }) => {
  const {
    data: activities,
    isLoading,
    error,
  } = api.activity.getActivitiesForSiteAndDay.useQuery({
    site,
    day,
  });
  const afternoonActivities = activities?.filter(filterAfternoonActivities);

  if (isLoading) {
    return <p>Chargement des activités en cours...</p>;
  }

  if (error) {
    return <p>Une erreur est survenue lors du chargement des activités</p>;
  }
  return (
    <>
      <h3 className={styles.period}>Après-midi</h3>
      {afternoonActivities?.length ? (
        afternoonActivities.map((activity) => (
          <Activity key={activity.id} activity={activity} />
        ))
      ) : (
        <p className={styles.activity}>
          Aucune activité trouvée pour ce site à cette date
        </p>
      )}
    </>
  );
};

const EveningActivity = ({ site, day }: { site: CAMPSITES; day: Date }) => {
  const {
    data: activities,
    isLoading,
    error,
  } = api.activity.getActivitiesForSiteAndDay.useQuery({
    site,
    day,
  });
  const eveningActivities = activities?.filter(filterEveningActivities);

  if (isLoading) {
    return <p>Chargement des activités en cours...</p>;
  }

  if (error) {
    return <p>Une erreur est survenue lors du chargement des activités</p>;
  }
  return (
    <>
      <h3 className={styles.period}>Soir</h3>
      {eveningActivities?.length ? (
        eveningActivities.map((activity) => (
          <Activity key={activity.id} activity={activity} />
        ))
      ) : (
        <p className={styles.activity}>
          Aucune activité trouvée pour ce site à cette date
        </p>
      )}
    </>
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

const filterEveningActivities = (activity: Activity) => {
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

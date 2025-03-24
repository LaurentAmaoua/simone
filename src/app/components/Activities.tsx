import { type Activity } from "~/server/db/schema";
import { type DateRange } from "react-day-picker";
import { skipToken } from "@tanstack/react-query";
import { type CAMPSITES } from "./Select";
import { api } from "~/trpc/react";
import { Button } from "./Button";
import { sortByChronologicalOrder, formatToFrenchDate } from "~/lib/datetime";

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
    site
      ? {
          site,
          range: { from: dateRange?.from, to: dateRange?.to },
        }
      : skipToken,
    { enabled: !!site },
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
      {daysWithActivities
        ?.sort(sortByChronologicalOrder)
        // Deduplicate dates by timestamp
        .filter(
          (date, index, self) =>
            index === self.findIndex((d) => d.getTime() === date.getTime()),
        )
        .map((day, index) => (
          <div key={`${formatToFrenchDate(day)}-${day.getTime()}-${index}`}>
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
    <div className={styles.activity}>
      <div className={styles.header}>
        <h3 className={styles.activityTitle}>{activity.Title}</h3>
      </div>
      <p className={styles.times}>
        {activity.Contenu_time ?? formatActivityTime(activity.Contenu_date)}
        {activity.useful_duration && ` - Durée: ${activity.useful_duration}`}
      </p>
      {activity.infos_description && (
        <p className={styles.description}>{activity.infos_description}</p>
      )}
    </div>
  );
};

// Helper function to format time from the Contenu_date
const formatActivityTime = (date: Date) => {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
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
          <Activity key={activity.ID} activity={activity} />
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
          <Activity key={activity.ID} activity={activity} />
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
          <Activity key={activity.ID} activity={activity} />
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
  // Check if Contenu_time is available
  if (activity.Contenu_time) {
    const timeParts = activity.Contenu_time.split(":");
    if (timeParts.length > 0) {
      const hours = Number(timeParts[0]);
      return hours < 12;
    }
  }

  // Fallback to Contenu_date
  const date = new Date(activity.Contenu_date);
  return date.getHours() < 12;
};

const filterAfternoonActivities = (activity: Activity) => {
  // Check if Contenu_time is available
  if (activity.Contenu_time) {
    const timeParts = activity.Contenu_time.split(":");
    if (timeParts.length > 0) {
      const hours = Number(timeParts[0]);
      return hours >= 12 && hours < 18;
    }
  }

  // Fallback to Contenu_date
  const date = new Date(activity.Contenu_date);
  return date.getHours() >= 12 && date.getHours() < 18;
};

const filterEveningActivities = (activity: Activity) => {
  // Check if Contenu_time is available
  if (activity.Contenu_time) {
    const timeParts = activity.Contenu_time.split(":");
    if (timeParts.length > 0) {
      const hours = Number(timeParts[0]);
      return hours >= 18;
    }
  }

  // Fallback to Contenu_date
  const date = new Date(activity.Contenu_date);
  return date.getHours() >= 18;
};

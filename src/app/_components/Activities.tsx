import { type TRPCClientErrorLike } from "@trpc/client";
import { type Activity } from "~/server/db/schema";
import { type AppRouter } from "~/server/api/root";
import { type DateRange } from "react-day-picker";
import { useMemo } from "react";

import styles from "./_styles/Activities.module.css";

export enum ACTIVITY_KIND {
  OFF_SITE = "OFF_SITE",
  ON_SITE_SPECIFIC = "ON_SITE_SPECIFIC",
  ON_SITE_GENERIC = "ON_SITE_GENERIC",
}

interface ActivitiesProps {
  activities: Activity[] | undefined;
  error: TRPCClientErrorLike<AppRouter> | null;
  isLoading: boolean;
  dateRange: DateRange | undefined;
}

export const Activities = ({
  activities,
  dateRange,
  error,
  isLoading,
}: ActivitiesProps) => {
  const genericActivities = useMemo(
    () =>
      activities?.filter(
        (activity) => activity.kind === ACTIVITY_KIND.ON_SITE_GENERIC,
      ),
    [activities],
  );
  const offSiteActivities = useMemo(
    () =>
      activities?.filter(
        (activity) => activity.kind === ACTIVITY_KIND.OFF_SITE,
      ),
    [activities],
  );
  const specificActivities = useMemo(
    () =>
      activities?.filter(
        (activity) => activity.kind === ACTIVITY_KIND.ON_SITE_SPECIFIC,
      ),
    [activities],
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
      {genericActivities && (
        <>
          <h2 className={styles.sectionTitle}>
            Activités disponibles sur le site
          </h2>
          {genericActivities.map((activity) => (
            <Activity key={activity.id} activity={activity} />
          ))}
        </>
      )}

      <h2 className={styles.sectionTitle}>Activités aux alentours du site</h2>
      {offSiteActivities?.length
        ? offSiteActivities.map((activity) => (
            <Activity key={activity.id} activity={activity} />
          ))
        : dateRange
          ? "Aucune activité aux alentours du site à cette date"
          : "Sélectionnez une date pour découvrir les activités aux alentours"}

      <h2 className={styles.sectionTitle}>Activités organisées sur le site</h2>
      {specificActivities?.length
        ? specificActivities.map((activity) => (
            <Activity key={activity.id} activity={activity} />
          ))
        : dateRange
          ? "Aucune activité organisée sur le site à cette date"
          : "Sélectionnez une date pour découvrir les activités organisées sur le site"}
    </div>
  );
};

const Activity = ({ activity }: { activity: Activity }) => {
  return (
    <a href={activity.url} className={styles.activity}>
      <h3 className={styles.activityTitle}>{activity.name}</h3>
      <p>{activity.description}</p>
    </a>
  );
};

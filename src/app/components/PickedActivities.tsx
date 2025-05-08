import {
  type MustSeeActivity,
  type LocalActivity,
  type Activity,
} from "~/server/db/schema";
import { useEffect, useState } from "react";
import styles from "./styles/PickedActivities.module.css";

export type PickedActivity = (MustSeeActivity | LocalActivity | Activity) & {
  type: "must-see" | "local" | "campsite";
};

interface PickedActivitiesProps {
  onRemoveActivity: (id: number, type: string) => void;
  pickedActivities: PickedActivity[];
}

export const PickedActivities = ({
  onRemoveActivity,
  pickedActivities,
}: PickedActivitiesProps) => {
  const [groupedActivities, setGroupedActivities] = useState<{
    mustSee: PickedActivity[];
    local: PickedActivity[];
    campsite: PickedActivity[];
  }>({
    mustSee: [],
    local: [],
    campsite: [],
  });

  useEffect(() => {
    const mustSee = pickedActivities.filter((a) => a.type === "must-see");
    const local = pickedActivities.filter((a) => a.type === "local");
    const campsite = pickedActivities.filter((a) => a.type === "campsite");

    setGroupedActivities({
      mustSee,
      local,
      campsite,
    });
  }, [pickedActivities]);

  if (pickedActivities.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Vous n&apos;avez pas encore sélectionné d&apos;activités.
        </p>
        <p className={styles.emptyInstructions}>
          Explorez les activités disponibles et ajoutez-les à votre liste pour
          planifier votre séjour.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {groupedActivities.mustSee.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Incontournables de la région</h2>
          <div className={styles.activities}>
            {groupedActivities.mustSee.map((activity) => (
              <PickedActivityCard
                key={`must-see-${activity.ID}`}
                activity={activity}
                onRemove={onRemoveActivity}
              />
            ))}
          </div>
        </div>
      )}

      {groupedActivities.local.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>À faire dans le coin</h2>
          <div className={styles.activities}>
            {groupedActivities.local.map((activity) => (
              <PickedActivityCard
                key={`local-${activity.ID}`}
                activity={activity}
                onRemove={onRemoveActivity}
              />
            ))}
          </div>
        </div>
      )}

      {groupedActivities.campsite.length > 0 && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Animations de camping</h2>
          <div className={styles.activities}>
            {groupedActivities.campsite.map((activity) => (
              <PickedActivityCard
                key={`campsite-${activity.ID}`}
                activity={activity}
                onRemove={onRemoveActivity}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PickedActivityCard = ({
  activity,
  onRemove,
}: {
  activity: PickedActivity;
  onRemove: (id: number, type: string) => void;
}) => {
  return (
    <div className={styles.activityCard}>
      <div className={styles.content}>
        <h3 className={styles.activityTitle}>{activity.Title}</h3>
        {"Location" in activity && (
          <p className={styles.location}>{activity.Location}</p>
        )}

        {"Contenu_time" in activity && (
          <p className={styles.time}>
            {activity.Contenu_time ?? formatActivityTime(activity.Contenu_date)}
            {activity.Contenu_duration &&
              ` - Durée: ${activity.Contenu_duration}`}
          </p>
        )}

        {"Description" in activity && activity.Description && (
          <p className={styles.description}>{activity.Description}</p>
        )}

        {"infos_description" in activity && activity.infos_description && (
          <p
            className={styles.description}
            dangerouslySetInnerHTML={{ __html: activity.infos_description }}
          ></p>
        )}

        <button
          className={styles.removeButton}
          onClick={() => onRemove(activity.ID, activity.type)}
        >
          Retirer
        </button>
      </div>
    </div>
  );
};

const formatActivityTime = (date: Date) => {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
};

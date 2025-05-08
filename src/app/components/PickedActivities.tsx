import {
  type MustSeeActivity,
  type LocalActivity,
  type Activity,
} from "~/server/db/schema";
import { useEffect, useState } from "react";
import { sortByChronologicalOrder, formatToFrenchDate } from "~/lib/datetime";
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
    campsiteByDay: Map<string, PickedActivity[]>;
  }>({
    mustSee: [],
    local: [],
    campsite: [],
    campsiteByDay: new Map(),
  });

  useEffect(() => {
    const mustSee = pickedActivities.filter((a) => a.type === "must-see");
    const local = pickedActivities.filter((a) => a.type === "local");
    const campsite = pickedActivities.filter((a) => a.type === "campsite");

    const campsiteByDay = new Map<string, PickedActivity[]>();

    campsite.forEach((activity) => {
      if ("Contenu_date" in activity && activity.Contenu_date) {
        const date = new Date(activity.Contenu_date);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

        if (!campsiteByDay.has(dateKey)) {
          campsiteByDay.set(dateKey, []);
        }

        const activitiesForDay = campsiteByDay.get(dateKey) ?? [];
        activitiesForDay.push(activity);
        campsiteByDay.set(dateKey, activitiesForDay);
      }
    });

    campsiteByDay.forEach((activities, dateKey) => {
      const sorted = [...activities].sort((a, b) => {
        if (!("Contenu_date" in a) || !("Contenu_date" in b)) return 0;

        if (a.Contenu_time && b.Contenu_time) {
          return a.Contenu_time.localeCompare(b.Contenu_time);
        }

        return (
          new Date(a.Contenu_date).getTime() -
          new Date(b.Contenu_date).getTime()
        );
      });
      campsiteByDay.set(dateKey, sorted);
    });

    setGroupedActivities({
      mustSee,
      local,
      campsite,
      campsiteByDay,
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

  const sortedDates = Array.from(groupedActivities.campsiteByDay.keys())
    .map((dateKey) => {
      const parts = dateKey.split("-");
      const year = parseInt(parts[0] ?? "0", 10);
      const month = parseInt(parts[1] ?? "0", 10);
      const day = parseInt(parts[2] ?? "1", 10);
      return new Date(year, month, day);
    })
    .sort(sortByChronologicalOrder);

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
          <div>
            {sortedDates.map((date) => {
              const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
              const activitiesForDay =
                groupedActivities.campsiteByDay.get(dateKey) ?? [];

              return (
                <div key={dateKey} className={styles.section}>
                  <h3 className={styles.dayTitle}>
                    {formatToFrenchDate(date, false)}
                  </h3>
                  <div className={styles.activities}>
                    {activitiesForDay.map((activity) => (
                      <PickedActivityCard
                        key={`campsite-${activity.ID}`}
                        activity={activity}
                        onRemove={onRemoveActivity}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
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

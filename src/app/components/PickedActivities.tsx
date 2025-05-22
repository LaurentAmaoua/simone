import {
  type MustSeeActivity,
  type LocalActivity,
  type CampsiteActivity,
} from "~/server/db/schema";
import { useEffect, useState } from "react";
import { sortByChronologicalOrder, formatToFrenchDate } from "~/lib/datetime";
import styles from "./styles/PickedActivities.module.css";
import { ActivityCard } from "./Activities";
import { CAMPSITES } from "./Select";

export type PickedActivity = (
  | MustSeeActivity
  | LocalActivity
  | CampsiteActivity
) & {
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
    campingGroups: Map<string, PickedActivity[]>;
  }>({
    mustSee: [],
    local: [],
    campsite: [],
    campsiteByDay: new Map(),
    campingGroups: new Map(),
  });

  useEffect(() => {
    const mustSee = pickedActivities.filter((a) => a.type === "must-see");
    const local = pickedActivities.filter((a) => a.type === "local");
    const campsite = pickedActivities.filter((a) => a.type === "campsite");

    const campsiteByDay = new Map<string, PickedActivity[]>();
    const campingGroups = new Map<string, PickedActivity[]>();

    // Group all activities by camping
    pickedActivities.forEach((activity) => {
      if (activity.Campings) {
        const campingName = activity.Campings as string;
        if (!campingGroups.has(campingName)) {
          campingGroups.set(campingName, []);
        }
        const activitiesForCamping = campingGroups.get(campingName) ?? [];
        activitiesForCamping.push(activity);
        campingGroups.set(campingName, activitiesForCamping);
      }
    });

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
      campingGroups,
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

  // Get sorted camping names
  const sortedCampings = Array.from(
    groupedActivities.campingGroups.keys(),
  ).sort();

  // Handler for when an activity card's button is clicked (will remove the activity)
  const handlePickActivity = (activity: PickedActivity) => {
    onRemoveActivity(activity.ID, activity.type);
  };

  // Helper function to safely compare campsite names
  const isSameCampsite = (
    activity: PickedActivity,
    campingName: string,
  ): boolean => {
    return (activity.Campings as string) === campingName;
  };

  return (
    <div className={styles.container}>
      {sortedCampings.map((camping) => (
        <div key={camping} className={styles.campingSection}>
          <h2 className={styles.campingTitle}>{camping}</h2>

          {/* Campsite activities for this camping */}
          {groupedActivities.campsite.filter((activity) =>
            isSameCampsite(activity, camping),
          ).length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Animations de camping</h3>
              <div>
                {sortedDates.map((date) => {
                  const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
                  const activitiesForDay =
                    groupedActivities.campsiteByDay
                      .get(dateKey)
                      ?.filter((activity) =>
                        isSameCampsite(activity, camping),
                      ) ?? [];

                  if (activitiesForDay.length === 0) return null;

                  return (
                    <div
                      key={`${camping}-${dateKey}`}
                      className={styles.section}
                    >
                      <h4 className={styles.dayTitle}>
                        {formatToFrenchDate(date, false)}
                      </h4>
                      <div className={styles.activities}>
                        {activitiesForDay.map((activity) => (
                          <ActivityCard
                            key={`campsite-${activity.ID}`}
                            activity={activity as CampsiteActivity}
                            activityType="campsite"
                            onPickActivity={handlePickActivity}
                            isPicked={true}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Must-see activities for this camping */}
          {groupedActivities.mustSee.filter((activity) =>
            isSameCampsite(activity, camping),
          ).length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                Incontournables de la région
              </h3>
              <div className={styles.activities}>
                {groupedActivities.mustSee
                  .filter((activity) => isSameCampsite(activity, camping))
                  .map((activity) => (
                    <ActivityCard
                      key={`must-see-${activity.ID}`}
                      activity={activity as MustSeeActivity}
                      activityType="must-see"
                      onPickActivity={handlePickActivity}
                      isPicked={true}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Local activities for this camping */}
          {groupedActivities.local.filter((activity) =>
            isSameCampsite(activity, camping),
          ).length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>À faire dans le coin</h3>
              <div className={styles.activities}>
                {groupedActivities.local
                  .filter((activity) => isSameCampsite(activity, camping))
                  .map((activity) => (
                    <ActivityCard
                      key={`local-${activity.ID}`}
                      activity={activity as LocalActivity}
                      activityType="local"
                      onPickActivity={handlePickActivity}
                      isPicked={true}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

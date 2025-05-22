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

// Interface for a day's schedule
interface DaySchedule {
  date: Date;
  activities: {
    morning: PickedActivity | null;
    afternoon: PickedActivity | null;
    evening: PickedActivity | null;
  };
}

// Constants for time slots
const TIME_SLOTS = {
  morning: { label: "Matin", hours: "6h - 12h" },
  afternoon: { label: "Après-midi", hours: "12h - 18h" },
  evening: { label: "Soirée", hours: "18h - 6h" },
};

export const PickedActivities = ({
  onRemoveActivity,
  pickedActivities,
}: PickedActivitiesProps) => {
  const [dailySchedules, setDailySchedules] = useState<DaySchedule[]>([]);

  useEffect(() => {
    if (pickedActivities.length === 0) {
      setDailySchedules([]);
      return;
    }

    // Group activities by camping first
    const campingGroups = new Map<string, PickedActivity[]>();

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

    // For each camping, organize activities by day and timeslot
    const allDailySchedules: DaySchedule[] = [];

    // Extract all dates from campsite activities
    const dateSet = new Set<string>();
    pickedActivities.forEach((activity) => {
      if (
        activity.type === "campsite" &&
        "Contenu_date" in activity &&
        activity.Contenu_date
      ) {
        const date = new Date(activity.Contenu_date);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        dateSet.add(dateKey);
      }
    });

    // Sort dates
    const sortedDates = Array.from(dateSet)
      .map((dateKey) => {
        const parts = dateKey.split("-");
        const year = parseInt(parts[0] ?? "0", 10);
        const month = parseInt(parts[1] ?? "0", 10);
        const day = parseInt(parts[2] ?? "1", 10);
        return new Date(year, month, day);
      })
      .sort(sortByChronologicalOrder);

    // Helper function to determine time slot for an activity
    const getTimeSlot = (
      activity: PickedActivity,
    ): "morning" | "afternoon" | "evening" | null => {
      // For campsite activities, use Contenu_time
      if (
        activity.type === "campsite" &&
        "Contenu_time" in activity &&
        activity.Contenu_time
      ) {
        const timeStr = activity.Contenu_time;
        const hour = parseInt(timeStr.split(":")[0], 10);

        if (hour >= 6 && hour < 12) return "morning";
        if (hour >= 12 && hour < 18) return "afternoon";
        return "evening";
      }

      // For must-see and local activities, use opening_time
      if (
        (activity.type === "must-see" || activity.type === "local") &&
        "opening_time" in activity &&
        activity.opening_time
      ) {
        const timeStr = activity.opening_time;
        const hour = parseInt(timeStr.split(":")[0], 10);

        if (hour >= 6 && hour < 12) return "morning";
        if (hour >= 12 && hour < 18) return "afternoon";
        return "evening";
      }

      return null; // Can't determine time slot
    };

    // For each camping
    campingGroups.forEach((activities, campingName) => {
      // For each date
      sortedDates.forEach((date) => {
        const dailySchedule: DaySchedule = {
          date,
          activities: {
            morning: null,
            afternoon: null,
            evening: null,
          },
        };

        // Filter activities for this date and camping
        const activitiesForDay = activities.filter((activity) => {
          if (
            activity.type === "campsite" &&
            "Contenu_date" in activity &&
            activity.Contenu_date
          ) {
            const activityDate = new Date(activity.Contenu_date);
            return (
              activityDate.getDate() === date.getDate() &&
              activityDate.getMonth() === date.getMonth() &&
              activityDate.getFullYear() === date.getFullYear()
            );
          }
          return false; // Only campsite activities have dates
        });

        // Add must-see and local activities
        const otherActivities = activities.filter(
          (activity) =>
            activity.type === "must-see" || activity.type === "local",
        );

        // Organize activities by time slot
        activitiesForDay.forEach((activity) => {
          const slot = getTimeSlot(activity);
          if (slot && !dailySchedule.activities[slot]) {
            dailySchedule.activities[slot] = activity;
          }
        });

        // Fill in remaining slots with other activities
        otherActivities.forEach((activity) => {
          const slot = getTimeSlot(activity);
          if (slot && !dailySchedule.activities[slot]) {
            dailySchedule.activities[slot] = activity;
          }
        });

        // Only add days that have at least one activity
        if (
          Object.values(dailySchedule.activities).some((act) => act !== null)
        ) {
          allDailySchedules.push(dailySchedule);
        }
      });
    });

    // Sort the daily schedules by date
    allDailySchedules.sort((a, b) => sortByChronologicalOrder(a.date, b.date));

    setDailySchedules(allDailySchedules);
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

  // Get sorted camping names
  const sortedCampings = Array.from(
    new Set(pickedActivities.map((activity) => activity.Campings)),
  ).sort();

  // Handler for when an activity card's button is clicked (will remove the activity)
  const handlePickActivity = (activity: PickedActivity) => {
    onRemoveActivity(activity.ID, activity.type);
  };

  return (
    <div className={styles.container}>
      {sortedCampings.map((camping) => (
        <div key={camping} className={styles.campingSection}>
          <h2 className={styles.campingTitle}>{camping}</h2>

          {dailySchedules.length > 0 ? (
            <div className={styles.scheduleContainer}>
              {dailySchedules.map((daySchedule, index) => (
                <div key={`day-${index}`} className={styles.daySchedule}>
                  <h3 className={styles.dateHeader}>
                    {formatToFrenchDate(daySchedule.date, false)}
                  </h3>

                  <div className={styles.timeSlots}>
                    {Object.entries(TIME_SLOTS).map(([slotKey, slotInfo]) => (
                      <div key={slotKey} className={styles.timeSlot}>
                        <div className={styles.timeSlotHeader}>
                          <span className={styles.timeSlotLabel}>
                            {slotInfo.label}
                          </span>
                          <span className={styles.timeSlotHours}>
                            {slotInfo.hours}
                          </span>
                        </div>

                        <div className={styles.timeSlotContent}>
                          {daySchedule.activities[
                            slotKey as keyof typeof daySchedule.activities
                          ] ? (
                            <ActivityCard
                              key={`${slotKey}-${daySchedule.activities[slotKey as keyof typeof daySchedule.activities]?.ID}`}
                              activity={
                                daySchedule.activities[
                                  slotKey as keyof typeof daySchedule.activities
                                ] as any
                              }
                              activityType={
                                daySchedule.activities[
                                  slotKey as keyof typeof daySchedule.activities
                                ]?.type as any
                              }
                              onPickActivity={handlePickActivity}
                              isPicked={true}
                            />
                          ) : (
                            <div className={styles.emptySlot}>
                              <p>Aucune activité programmée</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.section}>
              <p className={styles.emptyMessage}>
                Aucune activité planifiée. Cliquez sur "Générer mon planning"
                pour créer un planning automatiquement.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

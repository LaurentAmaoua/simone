import { sortByChronologicalOrder, formatToFrenchDate } from "~/lib/datetime";
import styles from "./styles/GeneratedSchedule.module.css";
import type {
  MustSeeActivity,
  LocalActivity,
  CampsiteActivity,
} from "~/server/db/schema";
import { type DaySchedule } from "~/server/api/routers/activity";
import { ActivityCard } from "./ActivityCard";

// Define ScheduleActivity type
type ScheduleActivity =
  | (MustSeeActivity & { type: "must-see" })
  | (LocalActivity & { type: "local" })
  | (CampsiteActivity & { type: "campsite" });

// Constants for time slots
const TIME_SLOTS = {
  morning: { label: "Matin", hours: "6h - 12h" },
  afternoon: { label: "Après-midi", hours: "12h - 18h" },
  evening: { label: "Soirée", hours: "18h - 6h" },
};

interface GeneratedScheduleProps {
  schedule: DaySchedule[];
  isLoading: boolean;
}

export const GeneratedSchedule = ({
  schedule,
  isLoading,
}: GeneratedScheduleProps) => {
  if (isLoading) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Génération du planning en cours...
        </p>
      </div>
    );
  }

  // Sort the schedule by date
  const sortedSchedule = [...schedule].sort((a, b) =>
    sortByChronologicalOrder(a.date, b.date),
  );

  return (
    <div className={styles.container}>
      {sortedSchedule.map((day, dayIndex) => (
        <div key={`day-${dayIndex}`}>
          <h3 className={styles.dateHeader}>
            {formatToFrenchDate(day.date, false, true)}
          </h3>

          <div className={styles.daySchedule}>
            {Object.entries(TIME_SLOTS).map(([slotKey, slotInfo]) => {
              const slotActivity = day[
                slotKey as keyof DaySchedule
              ] as ScheduleActivity | null;
              return (
                <div key={slotKey}>
                  <div className={styles.timeSlotHeader}>
                    <span className={styles.timeSlotLabel}>
                      {slotInfo.label}
                    </span>
                    <span className={styles.timeSlotHours}>
                      {slotInfo.hours}
                    </span>
                  </div>

                  <div className={styles.timeSlot}>
                    <div className={styles.timeSlotContent}>
                      {slotActivity ? (
                        <ActivityCard
                          activity={slotActivity}
                          activityType={slotActivity.type}
                        />
                      ) : (
                        <div className={styles.emptySlot}>
                          <p>Aucune activité programmée</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

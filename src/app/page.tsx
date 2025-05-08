"use client";

import { type CAMPSITES, Select } from "./components/Select";
import { type DateRange } from "react-day-picker";
import { Calendar } from "./components/Calendar";
import { Header } from "./components/Header";
import { Suspense, useState, useEffect } from "react";
import { Tabs } from "./components/Tabs";
import {
  SwipeableViews,
  SwipeableViewsFooter,
} from "./components/SwipeableViews";
import {
  PickedActivities,
  type PickedActivity,
} from "./components/PickedActivities";

import styles from "./styles/Home.module.css";

// Local storage key
const PICKED_ACTIVITIES_STORAGE_KEY = "planicamping_picked_activities";

// Type for serialized activities from localStorage
type SerializedPickedActivity = Omit<
  PickedActivity,
  "Contenu_date" | "createdAt" | "updatedAt" | "useful_date"
> & {
  Contenu_date?: string;
  createdAt: string;
  updatedAt: string | null;
  useful_date?: string | null;
};

export default function Home() {
  const [selectedSite, setSelectedSite] = useState<CAMPSITES>();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>();
  const [viewIndex, setViewIndex] = useState(0);
  const [pickedActivities, setPickedActivities] = useState<PickedActivity[]>(
    [],
  );

  // Load picked activities from localStorage on mount
  useEffect(() => {
    const savedActivities = localStorage.getItem(PICKED_ACTIVITIES_STORAGE_KEY);
    if (savedActivities) {
      try {
        const parsed = JSON.parse(
          savedActivities,
        ) as SerializedPickedActivity[];
        // Transform date strings back into Date objects
        const activitiesWithDates = parsed.map((activity) => {
          if (activity.type === "campsite" && activity.Contenu_date) {
            return {
              ...activity,
              Contenu_date: new Date(activity.Contenu_date),
              createdAt: new Date(activity.createdAt),
              updatedAt: activity.updatedAt
                ? new Date(activity.updatedAt)
                : null,
              useful_date: activity.useful_date
                ? new Date(activity.useful_date)
                : null,
            } as PickedActivity;
          }
          return {
            ...activity,
            createdAt: new Date(activity.createdAt),
            updatedAt: activity.updatedAt ? new Date(activity.updatedAt) : null,
          } as PickedActivity;
        });
        setPickedActivities(activitiesWithDates);
      } catch (error) {
        console.error("Failed to parse saved activities:", error);
      }
    }
  }, []);

  // Save to localStorage whenever pickedActivities changes
  useEffect(() => {
    localStorage.setItem(
      PICKED_ACTIVITIES_STORAGE_KEY,
      JSON.stringify(pickedActivities),
    );
  }, [pickedActivities]);

  // Function to handle picking an activity
  const handlePickActivity = (activity: PickedActivity) => {
    // Check if activity is already picked to avoid duplicates
    const isAlreadyPicked = pickedActivities.some(
      (pickedActivity) =>
        pickedActivity.ID === activity.ID &&
        pickedActivity.type === activity.type,
    );

    if (isAlreadyPicked) {
      // If already picked, remove it
      handleRemoveActivity(activity.ID, activity.type);
    } else {
      // Otherwise add it
      setPickedActivities([...pickedActivities, activity]);
    }
  };

  // Function to handle removing a picked activity
  const handleRemoveActivity = (id: number, type: string) => {
    setPickedActivities(
      pickedActivities.filter(
        (activity) => !(activity.ID === id && activity.type === type),
      ),
    );
  };

  return (
    <main className={styles.container}>
      <div className={styles.inner}>
        <Header />
        <div className={styles.flex}>
          <div className={styles.left}>
            <div className={styles.leftInner}>
              <div className={styles.attrContainer}>
                <h2 className={styles.sectionTitle}>Camping</h2>
                <Suspense fallback={<span>Chargement...</span>}>
                  <Select onSelect={setSelectedSite} />
                </Suspense>
              </div>
              <div className={styles.attrContainer}>
                <h2 className={styles.sectionTitle}>Date</h2>
                <Calendar
                  site={selectedSite}
                  disabled={!selectedSite}
                  date={selectedDateRange}
                  onSelect={setSelectedDateRange}
                />
              </div>
            </div>
          </div>
          <div className={styles.right}>
            <SwipeableViews
              initialIndex={viewIndex}
              onChangeIndex={setViewIndex}
            >
              <Tabs
                site={selectedSite}
                dateRange={selectedDateRange}
                onPickActivity={handlePickActivity}
                pickedActivities={pickedActivities}
              />
              <PickedActivities
                pickedActivities={pickedActivities}
                onRemoveActivity={handleRemoveActivity}
              />
            </SwipeableViews>
            <SwipeableViewsFooter
              labels={["Activités", "Mon Planning"]}
              activeIndex={viewIndex}
              onChangeIndex={setViewIndex}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

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

export default function Home() {
  const [selectedSite, setSelectedSite] = useState<CAMPSITES>();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>();
  const [viewIndex, setViewIndex] = useState(0);
  const [pickedActivities, setPickedActivities] = useState<PickedActivity[]>(
    [],
  );

  // Function to handle picking an activity
  const handlePickActivity = (activity: PickedActivity) => {
    // Check if activity is already picked to avoid duplicates
    const isAlreadyPicked = pickedActivities.some(
      (pickedActivity) =>
        pickedActivity.ID === activity.ID &&
        pickedActivity.type === activity.type,
    );

    if (!isAlreadyPicked) {
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

import { type DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { Activities } from "./Activities";
import { type CAMPSITES } from "./Select";
import { TABS } from "./TabTypes";
import { type PickedActivity } from "./PickedActivities";

import styles from "./styles/Tabs.module.css";

export interface TabsProps {
  site: CAMPSITES | undefined;
  dateRange: DateRange | undefined;
  onPickActivity: (activity: PickedActivity) => void;
  pickedActivities: PickedActivity[];
}

export const Tabs = ({
  site,
  dateRange,
  onPickActivity,
  pickedActivities,
}: TabsProps) => {
  const [selectedTab, setSelectedTab] = useState(TABS.MUST_SEE);

  useEffect(() => {
    if (dateRange) {
      setSelectedTab(TABS.CAMPSITE);
    }
  }, [dateRange]);

  return (
    <div className={styles.activitiesContainer}>
      <div className={styles.header}>
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tab} ${selectedTab === TABS.MUST_SEE ? styles.active : ""}`}
            onClick={() => setSelectedTab(TABS.MUST_SEE)}
          >
            Incontournables de la région
          </button>
          <button
            className={`${styles.tab} ${selectedTab === TABS.LOCAL ? styles.active : ""}`}
            onClick={() => setSelectedTab(TABS.LOCAL)}
          >
            À faire dans le coin
          </button>
          <button
            className={`${styles.tab} ${selectedTab === TABS.CAMPSITE ? styles.active : ""}`}
            onClick={() => setSelectedTab(TABS.CAMPSITE)}
          >
            Animations de camping
          </button>
        </div>
        <div className={styles.borderBottom}></div>
        <div className={styles.scrollGradient}></div>
      </div>
      <Activities
        site={site}
        activeTab={selectedTab}
        dateRange={dateRange}
        onPickActivity={onPickActivity}
        pickedActivities={pickedActivities}
      />
      <div className={styles.footerGradient}></div>
    </div>
  );
};

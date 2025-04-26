import { type DateRange } from "react-day-picker";
import { useEffect, useState } from "react";
import { Activities } from "./Activities";
import { type CAMPSITES } from "./Select";
import { TABS } from "./TabTypes";

import styles from "./styles/Tabs.module.css";

interface TabsProps {
  site: CAMPSITES | undefined;
  dateRange: DateRange | undefined;
}

export const Tabs = ({ site, dateRange }: TabsProps) => {
  const [selectedTab, setSelectedTab] = useState(TABS.MUST_SEE);
  console.log("selectedTab", selectedTab);

  useEffect(() => {
    if (dateRange) {
      setSelectedTab(TABS.CAMPSITE);
    }
  }, [dateRange]);

  return (
    <div className={styles.activitiesContainer}>
      <div className={styles.header}>
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
        <div className={styles.borderBottom}></div>
      </div>
      <Activities site={site} activeTab={selectedTab} dateRange={dateRange} />
      <div className={styles.footerGradient}></div>
    </div>
  );
};

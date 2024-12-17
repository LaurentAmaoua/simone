import { type DateRange } from "react-day-picker";
import { Activities } from "./Activities";
import { type CAMPSITES } from "./Select";
import { useEffect, useState } from "react";

import styles from "./styles/Tabs.module.css";

interface TabsProps {
  site: CAMPSITES;
  dateRange: DateRange | undefined;
}

enum TABS {
  GENERIC,
  SPECIFIC,
}

export const Tabs = ({ site, dateRange }: TabsProps) => {
  const [selectedTab, setSelectedTab] = useState(TABS.GENERIC);

  useEffect(() => {
    if (dateRange) {
      setSelectedTab(TABS.SPECIFIC);
    }
  }, [dateRange]);

  return (
    <div className={styles.activitiesContainer}>
      <div className={styles.header}>
        <button
          className={`${styles.tab} ${selectedTab === TABS.SPECIFIC ? styles.active : ""}`}
          onClick={() => setSelectedTab(TABS.SPECIFIC)}
        >
          Activités organisées
        </button>
        <button
          className={`${styles.tab} ${selectedTab === TABS.GENERIC ? styles.active : ""}`}
          onClick={() => setSelectedTab(TABS.GENERIC)}
        >
          Activités disponibles
        </button>
        <div className={styles.borderBottom}></div>
      </div>
      {!dateRange && selectedTab === TABS.SPECIFIC ? (
        <p className={styles.idle}>Veuillez sélectionner une date</p>
      ) : (
        <Activities
          site={site}
          dateRange={selectedTab === TABS.GENERIC ? undefined : dateRange}
        />
      )}
      <div className={styles.footerGradient}></div>
    </div>
  );
};

"use client";

import { type CAMPSITES, Select } from "./components/Select";
import { type DateRange } from "react-day-picker";
import { Calendar } from "./components/Calendar";
import { Header } from "./components/Header";
import { Suspense, useState } from "react";
import { GenerateScheduleButton } from "./components/GenerateScheduleButton";
import { Simone } from "../assets/Simone";

import styles from "./styles/Home.module.css";

export default function Home() {
  const [selectedSite, setSelectedSite] = useState<CAMPSITES>();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>();

  const handleTitleClick = () => {
    setSelectedDateRange(undefined);
    setSelectedSite(undefined);
  };

  return (
    <main className={styles.container}>
      <div className={styles.inner}>
        <Header onTitleClick={handleTitleClick} />
        <div className={styles.flex}>
          <div className={styles.contentLayout}>
            <div className={styles.left}>
              <div className={styles.leftInner}>
                <div className={styles.attrContainer}>
                  <h2 className={styles.sectionTitle}>Camping</h2>
                  <Suspense fallback={<span>Chargement...</span>}>
                    <Select
                      onSelect={setSelectedSite}
                      selectedSite={selectedSite}
                    />
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
              <GenerateScheduleButton
                site={selectedSite}
                dateRange={selectedDateRange}
              />
              <Simone />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

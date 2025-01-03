"use client";

import { type CAMPSITES, Select } from "./components/Select";
import { type DateRange } from "react-day-picker";
import { useSearchParams } from "next/navigation";
import { Calendar } from "./components/Calendar";
import { Header } from "./components/Header";
import { Tabs } from "./components/Tabs";
import { useState } from "react";

import styles from "./styles/Home.module.css";

export default function Home() {
  const searchParams = useSearchParams();
  const site = searchParams.get("site") as CAMPSITES | null;
  const [selectedSite, setSelectedSite] = useState<CAMPSITES>();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>();

  return (
    <main className={styles.container}>
      <div className={styles.inner}>
        <Header />
        <div className={styles.flex}>
          <div className={styles.left}>
            <div className={styles.leftInner}>
              <div className={styles.attrContainer}>
                <h2 className={styles.sectionTitle}>Camping</h2>
                <Select onSelect={setSelectedSite} defaultSelection={site} />
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
            {selectedSite ? (
              <Tabs site={selectedSite} dateRange={selectedDateRange} />
            ) : (
              <span className={styles.idle}>
                Veuillez sélectionner un site et une date
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

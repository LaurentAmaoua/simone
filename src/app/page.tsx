"use client";

import { type CAMPSITES, Select } from "./_components/Select";
import { Activities } from "./_components/Activities";
import { Calendar } from "./_components/Calendar";
import { skipToken } from "@tanstack/react-query";
import { Header } from "./_components/Header";
import { api } from "~/trpc/react";
import { useState } from "react";

import styles from "./_styles/Home.module.css";

export default function Home() {
  const [selectedSite, setSelectedSite] = useState<CAMPSITES | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>();

  const {
    data: activities,
    error,
    isLoading,
  } = api.activity.getActivitiesForSiteAndDate.useQuery(
    selectedSite ? { site: selectedSite, date: selectedDate } : skipToken,
    { enabled: !!selectedSite },
  );

  return (
    <main className={styles.container}>
      <div className={styles.inner}>
        <Header />
        <div className={styles.flex}>
          <div className={styles.left}>
            <div className={styles.leftInner}>
              <div className={styles.attrContainer}>
                <h2 className={styles.sectionTitle}>Camping</h2>
                <Select onSelect={setSelectedSite} />
              </div>
              <div className={styles.attrContainer}>
                <h2 className={styles.sectionTitle}>Date</h2>
                <Calendar
                  site={selectedSite}
                  disabled={!selectedSite}
                  date={selectedDate}
                  onSelect={setSelectedDate}
                />
              </div>
            </div>
          </div>
          <div className={styles.right}>
            {selectedSite ? (
              <>
                <div className={styles.activitiesContainer}>
                  <Activities
                    error={error}
                    isLoading={isLoading}
                    activities={activities}
                    date={selectedDate}
                  />
                </div>
                <div className={styles.footerGradient}></div>
              </>
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

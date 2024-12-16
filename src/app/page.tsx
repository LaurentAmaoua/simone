"use client";

import { type CAMPSITES, Select } from "./components/Select";
import { Activities } from "./components/Activities";
import { Calendar } from "./components/Calendar";
import { skipToken } from "@tanstack/react-query";
import { type DateRange } from "react-day-picker";
import { Header } from "./components/Header";
import { api } from "~/trpc/react";
import { useState } from "react";

import styles from "./styles/Home.module.css";

export default function Home() {
  const [selectedSite, setSelectedSite] = useState<CAMPSITES>();
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange>();

  const {
    data: genericActivities,
    error: genericActivitiesError,
    isLoading: genericActivitiesIsLoading,
  } = api.activity.getGenericActivitiesForSite.useQuery(
    selectedSite
      ? {
          site: selectedSite,
        }
      : skipToken,
    { enabled: !!selectedSite },
  );

  const {
    data: specificActivities,
    error: allActivitiesError,
    isLoading: allActivitiesIsLoading,
  } = api.activity.getSpecificActivitiesForSiteAndDateRange.useQuery(
    selectedSite && selectedDateRange?.from && selectedDateRange?.to
      ? {
          site: selectedSite,
          dateRange: {
            from: selectedDateRange.from,
            to: selectedDateRange.to,
          },
        }
      : skipToken,
    { enabled: !!selectedDateRange },
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
                  date={selectedDateRange}
                  onSelect={setSelectedDateRange}
                />
              </div>
            </div>
          </div>
          <div className={styles.right}>
            {selectedSite ? (
              <>
                <div className={styles.activitiesContainer}>
                  <Activities
                    error={genericActivitiesError ?? allActivitiesError}
                    isLoading={
                      genericActivitiesIsLoading || allActivitiesIsLoading
                    }
                    specificActivities={specificActivities}
                    genericActivities={genericActivities}
                    dateRange={selectedDateRange}
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

import { sortByChronologicalOrder, formatToFrenchDate } from "~/lib/datetime";
import { type DateRange } from "react-day-picker";
import { skipToken } from "@tanstack/react-query";
import type { CAMPSITES } from "./Select";
import { api } from "~/trpc/react";
import { Button } from "./Button";
import { TABS } from "./TabTypes";
import { useState } from "react";
import {
  type MustSeeActivity,
  type LocalActivity,
  type Activity,
} from "~/server/db/schema";

import styles from "./styles/Activities.module.css";

interface ActivitiesProps {
  site: CAMPSITES | undefined;
  dateRange: DateRange | undefined;
  activeTab: TABS;
}

export const Activities = ({ site, dateRange, activeTab }: ActivitiesProps) => {
  const [localCategory, setLocalCategory] = useState<string | undefined>(
    undefined,
  );
  // Get all activity categories for local activities - only if we have a valid site
  const { data: localCategories } =
    api.activity.getLocalActivityCategories.useQuery(
      site ? { site } : skipToken, // Use skipToken to completely skip the query
      {
        // Only enable when we have a valid site AND we're on the local tab
        enabled: site && activeTab === TABS.LOCAL,
      },
    );

  // UI check for site selection
  if (!site) {
    return (
      <div className={styles.container}>
        <p>Veuillez sélectionner un camping</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {activeTab === TABS.MUST_SEE && <MustSeeActivitiesTab site={site} />}
      {activeTab === TABS.LOCAL && (
        <LocalActivitiesTab
          site={site}
          categories={localCategories ?? []}
          activeCategory={localCategory}
          onCategoryChange={setLocalCategory}
        />
      )}
      {activeTab === TABS.CAMPSITE && (
        <CampsiteActivitiesTab site={site} dateRange={dateRange} />
      )}
    </div>
  );
};

const MustSeeActivitiesTab = ({ site }: { site: string }) => {
  const {
    data: activities,
    isLoading,
    error,
  } = api.activity.getMustSeeActivities.useQuery(
    site ? { site } : skipToken, // Use skipToken to completely skip the query
    { enabled: !!site },
  );

  if (isLoading) {
    return <p>Chargement des activités incontournables en cours...</p>;
  }

  if (error) {
    return (
      <p>
        Une erreur est survenue lors du chargement des activités incontournables
      </p>
    );
  }

  if (!activities || activities.length === 0) {
    return <p>Aucune activité incontournable trouvée pour ce site</p>;
  }

  return (
    <div className={styles.activities}>
      {activities.map((activity) => (
        <MustSeeActivityCard key={activity.ID} activity={activity} />
      ))}
    </div>
  );
};

const LocalActivitiesTab = ({
  site,
  categories,
  activeCategory,
  onCategoryChange,
}: {
  site: string;
  categories: string[];
  activeCategory?: string;
  onCategoryChange: (category: string | undefined) => void;
}) => {
  const {
    data: activities,
    isLoading,
    error,
  } = api.activity.getLocalActivities.useQuery(
    site
      ? {
          site,
          category: activeCategory,
        }
      : skipToken, // Use skipToken to completely skip the query
    { enabled: !!site },
  );

  if (isLoading) {
    return <p>Chargement des activités locales en cours...</p>;
  }

  if (error) {
    return (
      <p>Une erreur est survenue lors du chargement des activités locales</p>
    );
  }

  if (!activities || activities.length === 0) {
    return <p>Aucune activité locale trouvée pour ce site</p>;
  }

  return (
    <>
      <div className={styles.categoryFilter}>
        <button
          className={`${styles.categoryButton} ${!activeCategory ? styles.activeCategory : ""}`}
          onClick={() => onCategoryChange(undefined)}
        >
          Tous
        </button>
        {categories.map((category) => (
          <button
            key={category}
            className={`${styles.categoryButton} ${activeCategory === category ? styles.activeCategory : ""}`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <div className={styles.activities}>
        {activities.map((activity) => (
          <LocalActivityCard key={activity.ID} activity={activity} />
        ))}
      </div>
    </>
  );
};

const CampsiteActivitiesTab = ({
  site,
  dateRange,
}: {
  site: string;
  dateRange: DateRange | undefined;
}) => {
  const {
    data: daysWithActivities,
    isLoading,
    error,
  } = api.activity.getDaysWithActivitiesForSiteAndDateRange.useQuery(
    site && dateRange
      ? {
          site,
          range: { from: dateRange.from, to: dateRange.to },
        }
      : skipToken,
    { enabled: !!site },
  );

  if (isLoading) {
    return <p>Chargement des animations en cours...</p>;
  }

  if (error) {
    return <p>Une erreur est survenue lors du chargement des animations</p>;
  }

  return (
    <div>
      {daysWithActivities
        ?.sort(sortByChronologicalOrder)
        .filter(
          (date, index, self) =>
            index === self.findIndex((d) => d.getTime() === date.getTime()),
        )
        .map((day, index) => (
          <div
            key={`${formatToFrenchDate(day)}-${day.getTime()}-${index}`}
            className={styles.dayGroup}
          >
            <h2 className={styles.day}>{formatToFrenchDate(day)}</h2>
            <div className={styles.dayActivities}>
              <CampsiteDayActivities site={site} day={day} />
            </div>
          </div>
        ))}
    </div>
  );
};

const CampsiteDayActivities = ({ site, day }: { site: string; day: Date }) => {
  const isDayValid = !!day && day instanceof Date && !isNaN(day.getTime());
  const areInputsValid = !!site && isDayValid;

  const {
    data: activities,
    isLoading,
    error,
  } = api.activity.getActivitiesForSiteAndDay.useQuery(
    areInputsValid ? { site, day } : skipToken, // Use skipToken to completely skip the query
    { enabled: areInputsValid },
  );

  // Early return for invalid inputs - UI check
  if (!areInputsValid) {
    return <p>Données invalides pour charger les activités</p>;
  }

  if (isLoading) {
    return <p>Chargement des activités en cours...</p>;
  }

  if (error) {
    return <p>Une erreur est survenue lors du chargement des activités</p>;
  }

  if (!activities || activities.length === 0) {
    return <p>Aucune activité trouvée pour ce jour</p>;
  }

  // Sort activities by time
  const sortedActivities = [...activities].sort((a, b) => {
    const timeA = a.Contenu_time
      ? Number(a.Contenu_time.split(":")[0])
      : new Date(a.Contenu_date).getHours();
    const timeB = b.Contenu_time
      ? Number(b.Contenu_time.split(":")[0])
      : new Date(b.Contenu_date).getHours();
    return timeA - timeB;
  });

  return (
    <div className={styles.activitiesList}>
      {sortedActivities.map((activity) => (
        <CampsiteActivityCard key={activity.ID} activity={activity} />
      ))}
    </div>
  );
};

const CampsiteActivityCard = ({ activity }: { activity: Activity }) => {
  return (
    <div className={styles.activityCard}>
      <div className={styles.header}>
        <h3 className={styles.activityTitle}>{activity.Title}</h3>
      </div>
      <p className={styles.times}>
        {activity.Contenu_time ?? formatActivityTime(activity.Contenu_date)}
        {activity.useful_duration && ` - Durée: ${activity.useful_duration}`}
      </p>
      {activity.infos_description && (
        <p className={styles.description}>{activity.infos_description}</p>
      )}
    </div>
  );
};

const MustSeeActivityCard = ({ activity }: { activity: MustSeeActivity }) => {
  return (
    <div className={styles.card}>
      {activity.Image && (
        <div className={styles.activityImage}>
          <img src={activity.Image} alt={activity.Title} />
        </div>
      )}
      <div className={styles.content}>
        <h3 className={styles.activityTitle}>{activity.Title}</h3>
        <p className={styles.location}>{activity.Location}</p>
        {activity.Distance && activity.Duration && (
          <p className={styles.details}>
            <span className={styles.distance}>{activity.Distance}</span> •
            <span className={styles.duration}>{activity.Duration}</span>
          </p>
        )}
        {activity.Description && (
          <p className={styles.description}>{activity.Description}</p>
        )}
        {activity.ExternalUrl && (
          <div className={styles.activityFooter}>
            <Button>
              <a
                href={activity.ExternalUrl}
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                En savoir plus
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const LocalActivityCard = ({ activity }: { activity: LocalActivity }) => {
  return (
    <div className={styles.card}>
      {activity.Image && (
        <div className={styles.activityImage}>
          <img src={activity.Image} alt={activity.Title} />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.category}>{activity.Category}</div>
        <h3 className={styles.activityTitle}>{activity.Title}</h3>
        <p className={styles.location}>{activity.Location}</p>
        {activity.Distance && activity.Duration && (
          <p className={styles.details}>
            <span className={styles.distance}>{activity.Distance}</span> •
            <span className={styles.duration}>{activity.Duration}</span>
          </p>
        )}
        {activity.Description && (
          <p className={styles.description}>{activity.Description}</p>
        )}
        {activity.ExternalUrl && (
          <div className={styles.activityFooter}>
            <Button>
              <a
                href={activity.ExternalUrl}
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                En savoir plus
              </a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const formatActivityTime = (date: Date) => {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
};

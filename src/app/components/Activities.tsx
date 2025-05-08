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
import { type PickedActivity } from "./PickedActivities";

import styles from "./styles/Activities.module.css";

export interface ActivitiesProps {
  site: CAMPSITES | undefined;
  dateRange: DateRange | undefined;
  activeTab: TABS;
  onPickActivity: (activity: PickedActivity) => void;
  pickedActivities: PickedActivity[];
}

export const Activities = ({
  site,
  dateRange,
  activeTab,
  onPickActivity,
  pickedActivities,
}: ActivitiesProps) => {
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

  if (!site) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>Veuillez sélectionner un camping</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {activeTab === TABS.MUST_SEE && (
        <MustSeeActivitiesTab
          site={site}
          onPickActivity={onPickActivity}
          pickedActivities={pickedActivities}
        />
      )}
      {activeTab === TABS.LOCAL && (
        <LocalActivitiesTab
          site={site}
          categories={localCategories ?? []}
          activeCategory={localCategory}
          onCategoryChange={setLocalCategory}
          onPickActivity={onPickActivity}
          pickedActivities={pickedActivities}
        />
      )}
      {activeTab === TABS.CAMPSITE && (
        <CampsiteActivitiesTab
          site={site}
          dateRange={dateRange}
          onPickActivity={onPickActivity}
          pickedActivities={pickedActivities}
        />
      )}
    </div>
  );
};

const MustSeeActivitiesTab = ({
  site,
  onPickActivity,
  pickedActivities,
}: {
  site: string;
  onPickActivity: (activity: PickedActivity) => void;
  pickedActivities: PickedActivity[];
}) => {
  const {
    data: activities,
    isLoading,
    error,
  } = api.activity.getMustSeeActivities.useQuery(
    site ? { site } : skipToken, // Use skipToken to completely skip the query
    { enabled: !!site },
  );

  if (isLoading) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Chargement des activités incontournables en cours...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Une erreur est survenue lors du chargement des activités
          incontournables
        </p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Aucune activité incontournable trouvée pour ce site
        </p>
      </div>
    );
  }

  return (
    <div className={styles.activities}>
      {activities.map((activity) => (
        <MustSeeActivityCard
          key={activity.ID}
          activity={activity}
          onPickActivity={onPickActivity}
          isPicked={pickedActivities.some(
            (a) => a.ID === activity.ID && a.type === "must-see",
          )}
        />
      ))}
    </div>
  );
};

const LocalActivitiesTab = ({
  site,
  categories,
  activeCategory,
  onCategoryChange,
  onPickActivity,
  pickedActivities,
}: {
  site: string;
  categories: string[];
  activeCategory?: string;
  onCategoryChange: (category: string | undefined) => void;
  onPickActivity: (activity: PickedActivity) => void;
  pickedActivities: PickedActivity[];
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
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Chargement des activités locales en cours...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Une erreur est survenue lors du chargement des activités locales
        </p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Aucune activité locale trouvée pour ce site
        </p>
      </div>
    );
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
          <LocalActivityCard
            key={activity.ID}
            activity={activity}
            onPickActivity={onPickActivity}
            isPicked={pickedActivities.some(
              (a) => a.ID === activity.ID && a.type === "local",
            )}
          />
        ))}
      </div>
    </>
  );
};

const CampsiteActivitiesTab = ({
  site,
  dateRange,
  onPickActivity,
  pickedActivities,
}: {
  site: string;
  dateRange: DateRange | undefined;
  onPickActivity: (activity: PickedActivity) => void;
  pickedActivities: PickedActivity[];
}) => {
  // If only the "from" date is selected, use it for both from and to
  const effectiveDateRange = dateRange?.from
    ? {
        from: dateRange.from,
        to: dateRange.to ?? dateRange.from,
      }
    : undefined;

  // Check if we have a valid date range to query with
  const isValidDateRange = !!effectiveDateRange?.from;

  const {
    data: daysWithActivities,
    isLoading,
    error,
  } = api.activity.getDaysWithActivitiesForSiteAndDateRange.useQuery(
    site && isValidDateRange
      ? {
          site,
          range: {
            from: effectiveDateRange.from,
            to: effectiveDateRange.to,
          },
        }
      : skipToken,
    { enabled: !!site && isValidDateRange },
  );

  // Return early if site is not selected
  if (!site) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>Veuillez sélectionner un camping</p>
      </div>
    );
  }

  // Return early if no date is selected
  if (!isValidDateRange) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>Veuillez sélectionner une date</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Chargement des animations en cours...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Une erreur est survenue lors du chargement des animations
        </p>
      </div>
    );
  }

  // Show message if no activities found for the selected date range
  if (!daysWithActivities || daysWithActivities.length === 0) {
    const singleDay =
      effectiveDateRange.from.getTime() === effectiveDateRange.to.getTime();
    return singleDay ? (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Aucune animation n&apos;est prévue pour le{" "}
          {formatToFrenchDate(effectiveDateRange.from)}
        </p>
      </div>
    ) : (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Aucune animation n&apos;est prévue pour la période sélectionnée
        </p>
      </div>
    );
  }

  const groupedDays = new Map<string, Date>();

  daysWithActivities.forEach((date) => {
    if (date) {
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const dateKey = `${year}-${month}-${day}`;

      if (!groupedDays.has(dateKey)) {
        groupedDays.set(dateKey, date);
      }
    }
  });

  const uniqueDays = Array.from(groupedDays.values());

  return (
    <div>
      {uniqueDays.sort(sortByChronologicalOrder).map((day, index) => (
        <div
          key={`day-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}-${index}`}
          className={styles.dayGroup}
        >
          <div className={styles.stickyDayHeader}>
            <h2 className={styles.day}>{formatToFrenchDate(day, false)}</h2>
          </div>
          <div className={styles.dayActivities}>
            <CampsiteDayActivities
              site={site}
              day={day}
              onPickActivity={onPickActivity}
              pickedActivities={pickedActivities}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const CampsiteDayActivities = ({
  site,
  day,
  onPickActivity,
  pickedActivities,
}: {
  site: string;
  day: Date;
  onPickActivity: (activity: PickedActivity) => void;
  pickedActivities: PickedActivity[];
}) => {
  const areInputsValid = !!site && !!day;

  // Set date range for the specific day
  const normalizedFrom = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
  );
  const normalizedTo = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
  );

  const {
    data: activities,
    isLoading,
    error,
  } = api.activity.getActivitiesForSiteAndDateRange.useQuery(
    areInputsValid
      ? { site, dateRange: { from: normalizedFrom, to: normalizedTo } }
      : skipToken,
    { enabled: areInputsValid },
  );

  if (!areInputsValid) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Données invalides pour charger les activités
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Chargement des activités en cours...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Une erreur est survenue lors du chargement des activités
        </p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>
          Aucune activité trouvée pour ce jour
        </p>
      </div>
    );
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
        <CampsiteActivityCard
          key={activity.ID}
          activity={activity}
          onPickActivity={onPickActivity}
          isPicked={pickedActivities.some(
            (a) => a.ID === activity.ID && a.type === "campsite",
          )}
        />
      ))}
    </div>
  );
};

const CampsiteActivityCard = ({
  activity,
  onPickActivity,
  isPicked,
}: {
  activity: Activity;
  onPickActivity: (activity: PickedActivity) => void;
  isPicked: boolean;
}) => {
  const [expanded, setExpanded] = useState(false);
  const maxCharacters = 250;

  const hasLongDescription =
    activity.infos_description &&
    activity.infos_description.length > maxCharacters;

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handlePickActivity = () => {
    onPickActivity({
      ...activity,
      type: "campsite",
    });
  };

  return (
    <div className={styles.activityCard}>
      <div className={styles.header}>
        <h3 className={styles.activityTitle}>{activity.Title}</h3>
        <button
          className={`${styles.pickButton} ${isPicked ? styles.picked : ""}`}
          onClick={handlePickActivity}
          aria-label={isPicked ? "Activité ajoutée" : "Ajouter à mon planning"}
        >
          {isPicked ? "✓" : "+"}
        </button>
      </div>
      <p className={styles.times}>
        {activity.Contenu_time ?? formatActivityTime(activity.Contenu_date)}
        {activity.Contenu_duration && ` - Durée: ${activity.Contenu_duration}`}
      </p>
      {activity.infos_description && (
        <div className={styles.descriptionContainer}>
          <p
            className={styles.description}
            dangerouslySetInnerHTML={{
              __html:
                hasLongDescription && !expanded
                  ? `${activity.infos_description.substring(0, maxCharacters)}...`
                  : activity.infos_description,
            }}
          ></p>
          {hasLongDescription && (
            <button className={styles.readMoreButton} onClick={toggleExpand}>
              {expanded ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const MustSeeActivityCard = ({
  activity,
  onPickActivity,
  isPicked,
}: {
  activity: MustSeeActivity;
  onPickActivity: (activity: PickedActivity) => void;
  isPicked: boolean;
}) => {
  const handlePickActivity = () => {
    onPickActivity({
      ...activity,
      type: "must-see",
    });
  };

  return (
    <div className={styles.card}>
      {activity.Image && (
        <div className={styles.activityImage}>
          <img src={activity.Image} alt={activity.Title} />
        </div>
      )}
      <div className={styles.content}>
        <h3 className={styles.activityTitle}>
          {activity.Title}
          <button
            className={`${styles.pickButton} ${isPicked ? styles.picked : ""}`}
            onClick={handlePickActivity}
            aria-label={
              isPicked ? "Activité ajoutée" : "Ajouter à mon planning"
            }
          >
            {isPicked ? "✓" : "+"}
          </button>
        </h3>
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

const LocalActivityCard = ({
  activity,
  onPickActivity,
  isPicked,
}: {
  activity: LocalActivity;
  onPickActivity: (activity: PickedActivity) => void;
  isPicked: boolean;
}) => {
  const handlePickActivity = () => {
    onPickActivity({
      ...activity,
      type: "local",
    });
  };

  return (
    <div className={styles.card}>
      {activity.Image && (
        <div className={styles.activityImage}>
          <img src={activity.Image} alt={activity.Title} />
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.category}>{activity.Category}</div>
        <h3 className={styles.activityTitle}>
          {activity.Title}
          <button
            className={`${styles.pickButton} ${isPicked ? styles.picked : ""}`}
            onClick={handlePickActivity}
            aria-label={
              isPicked ? "Activité ajoutée" : "Ajouter à mon planning"
            }
          >
            {isPicked ? "✓" : "+"}
          </button>
        </h3>
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

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
  type CampsiteActivity,
} from "~/server/db/schema";

import styles from "./styles/Activities.module.css";
import { FamilyIcon } from "~/assets/family-icon";

export interface ActivitiesProps {
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

  if (!site) {
    return (
      <div className={styles.emptyContainer}>
        <p className={styles.emptyMessage}>Veuillez sélectionner un camping</p>
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
        <ActivityCard
          key={activity.ID}
          activity={activity}
          activityType="must-see"
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
          <ActivityCard
            key={activity.ID}
            activity={activity}
            activityType="local"
          />
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
            <CampsiteDayActivities site={site} day={day} />
          </div>
        </div>
      ))}
    </div>
  );
};

const CampsiteDayActivities = ({ site, day }: { site: string; day: Date }) => {
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
        <ActivityCard
          key={activity.ID}
          activity={activity}
          activityType="campsite"
        />
      ))}
    </div>
  );
};

const parseCibles = (cibles: string | null | undefined): string => {
  return cibles?.replace(/[|>]/g, ", ") ?? "";
};

const formatActivityTime = (date: Date) => {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
};

// Unified Activity Card Component
type ActivityCardProps<T extends "must-see" | "local" | "campsite"> = {
  activity: T extends "must-see"
    ? MustSeeActivity
    : T extends "local"
      ? LocalActivity
      : CampsiteActivity;
  activityType: T;
};

const parseCategories = (categories: string | null | undefined): string[] => {
  if (!categories) return [];

  // Split by pipe
  return categories
    .split("|")
    .map((category) => {
      // If it contains ">" take only what's after ">"
      if (category.includes(">")) {
        return category.split(">").pop()?.trim() ?? "";
      }
      return category.trim();
    })
    .filter(Boolean); // Remove empty strings
};

export const ActivityCard = <T extends "must-see" | "local" | "campsite">({
  activity,
  activityType,
}: ActivityCardProps<T>) => {
  const [expanded, setExpanded] = useState(false);
  const maxCharacters = 250;

  if (activityType === "campsite") {
    const campsiteActivity = activity as CampsiteActivity;
    const hasLongDescription =
      campsiteActivity.infos_description &&
      campsiteActivity.infos_description.length > maxCharacters;

    const toggleExpand = () => {
      setExpanded(!expanded);
    };

    const categories = parseCategories(campsiteActivity.Categories);

    return (
      <div className={styles.card}>
        <div className={styles.content}>
          {categories.length > 0 && (
            <div className={styles.categories}>
              {categories.map((category, index) => (
                <span key={`${category}-${index}`} className={styles.category}>
                  {category}
                </span>
              ))}
            </div>
          )}
          <h3 className={styles.activityTitle}>{campsiteActivity.Title}</h3>
          <p className={styles.times}>
            {campsiteActivity.Contenu_time ??
              formatActivityTime(campsiteActivity.Contenu_date)}
            {campsiteActivity.Contenu_duration &&
              ` - Durée: ${campsiteActivity.Contenu_duration}`}
          </p>
          {campsiteActivity.Contenu_place && (
            <p className={styles.location}>
              📍 {campsiteActivity.Contenu_place}
            </p>
          )}
          {campsiteActivity.infos_description && (
            <p
              className={styles.description}
              dangerouslySetInnerHTML={{
                __html:
                  hasLongDescription && !expanded
                    ? `${campsiteActivity.infos_description.substring(0, maxCharacters)}...`
                    : campsiteActivity.infos_description,
              }}
            ></p>
          )}
          <div className={styles.activityFooter}>
            {campsiteActivity.Cibles && (
              <p className={styles.targetAudience}>
                <FamilyIcon />{" "}
                <span className={styles.targetAudienceLabel}>
                  {parseCibles(campsiteActivity.Cibles)}
                </span>
              </p>
            )}
            {hasLongDescription && (
              <button className={styles.readMoreButton} onClick={toggleExpand}>
                {expanded ? "Voir moins" : "Voir plus"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  } else if (activityType === "local") {
    const localActivity = activity as LocalActivity;

    return (
      <div className={styles.card}>
        {localActivity.Image && (
          <div className={styles.activityImage}>
            <img src={localActivity.Image} alt={localActivity.Title} />
          </div>
        )}
        <div className={styles.content}>
          {localActivity.Category && (
            <div className={styles.categories}>
              <span className={styles.category}>{localActivity.Category}</span>
            </div>
          )}
          <h3 className={styles.activityTitle}>{localActivity.Title}</h3>
          <p className={styles.location}>{localActivity.Location}</p>
          {localActivity.opening_time && (
            <p className={styles.times}>
              {/* 10:00:00 -> 10:00 */}
              {localActivity.opening_time.split(":")[0]}:
              {localActivity.opening_time.split(":")[1]}
              {localActivity.closing_time &&
                ` - ${localActivity.closing_time.split(":")[0]}:${localActivity.closing_time.split(":")[1]}`}
            </p>
          )}
          {localActivity.Distance && localActivity.Duration && (
            <p className={styles.details}>
              <span className={styles.distance}>{localActivity.Distance}</span>{" "}
              •<span className={styles.duration}>{localActivity.Duration}</span>
            </p>
          )}
          {localActivity.Description && (
            <p className={styles.description}>{localActivity.Description}</p>
          )}
          {localActivity.ExternalUrl && (
            <div className={styles.activityFooter}>
              <Button>
                <a
                  href={localActivity.ExternalUrl}
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
  } else {
    const mustSeeActivity = activity as MustSeeActivity;

    return (
      <div className={styles.card}>
        {mustSeeActivity.Image && (
          <div className={styles.activityImage}>
            <img src={mustSeeActivity.Image} alt={mustSeeActivity.Title} />
          </div>
        )}
        <div className={styles.content}>
          <h3 className={styles.activityTitle}>{mustSeeActivity.Title}</h3>
          <p className={styles.location}>{mustSeeActivity.Location}</p>
          {mustSeeActivity.opening_time && (
            <p className={styles.times}>
              {/* 10:00:00 -> 10:00 */}
              {mustSeeActivity.opening_time.split(":")[0]}:
              {mustSeeActivity.opening_time.split(":")[1]}
              {mustSeeActivity.closing_time &&
                ` - ${mustSeeActivity.closing_time.split(":")[0]}:${mustSeeActivity.closing_time.split(":")[1]}`}
            </p>
          )}
          {mustSeeActivity.Distance && mustSeeActivity.Duration && (
            <p className={styles.details}>
              <span className={styles.distance}>
                {mustSeeActivity.Distance}
              </span>{" "}
              •
              <span className={styles.duration}>
                {mustSeeActivity.Duration}
              </span>
            </p>
          )}
          {mustSeeActivity.Description && (
            <p className={styles.description}>{mustSeeActivity.Description}</p>
          )}
          {mustSeeActivity.ExternalUrl && (
            <div className={styles.activityFooter}>
              <Button>
                <a
                  href={mustSeeActivity.ExternalUrl}
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
  }
};

// Re-export the unified card for backward compatibility with PickedActivities.tsx
export const CampsiteActivityCard = ActivityCard;
export const MustSeeActivityCard = ActivityCard;
export const LocalActivityCard = ActivityCard;

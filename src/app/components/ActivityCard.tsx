import { Button } from "./Button";
import { useState } from "react";
import {
  type MustSeeActivity,
  type LocalActivity,
  type CampsiteActivity,
} from "~/server/db/schema";
import { FamilyIcon } from "~/assets/family-icon";

import styles from "./styles/ActivityCard.module.css";

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

import { type CAMPSITES } from "~/app/components/Select";
import { type InferSelectModel } from "drizzle-orm";
import {
  pgTableCreator,
  timestamp,
  integer,
  varchar,
  index,
  text,
  boolean,
  time,
  pgEnum,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `planicamping_${name}`);

// French weekdays enum for open days
export const weekdaysEnum = pgEnum("weekday", [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
]);

export type CampsiteActivity = InferSelectModel<typeof campsiteActivities>;

export const campsiteActivities = createTable(
  "campsite_activity",
  {
    ID: integer("ID").primaryKey().generatedByDefaultAsIdentity().notNull(),
    Title: varchar("Title", { length: 256 }).notNull(),
    Categories: varchar("Categories", { length: 255 }),
    Cibles: varchar("Cibles", { length: 255 }),
    Contenu: text("Contenu"),
    Contenu_is_weekly: boolean("Contenu_is_weekly").default(false),
    Contenu_is_featured: boolean("Contenu_is_featured").default(false),
    Contenu_place: varchar("Contenu_place", { length: 255 }),
    infos_description: text("infos_description"),
    Campings: varchar("Campings", { length: 255 }).$type<CAMPSITES>().notNull(),
    Contenu_date: timestamp("Contenu_date").notNull(),
    Contenu_time: varchar("Contenu_time", { length: 10 }),
    Contenu_duration: varchar("Contenu_duration", { length: 50 }),
    useful_date: timestamp("useful_date"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    titleIndex: index("title_idx").on(example.Title),
  }),
);

// Table for "Incontournables de la région"
export type MustSeeActivity = InferSelectModel<typeof mustSeeActivities>;

export const mustSeeActivities = createTable(
  "must_see_activity",
  {
    ID: integer("ID").primaryKey().generatedByDefaultAsIdentity().notNull(),
    Title: varchar("Title", { length: 256 }).notNull(),
    Description: text("Description"),
    Location: varchar("Location", { length: 255 }).notNull(),
    Distance: varchar("Distance", { length: 50 }),
    Duration: varchar("Duration", { length: 50 }),
    ExternalUrl: varchar("ExternalUrl", { length: 512 }),
    opening_time: time("opening_time"),
    closing_time: time("closing_time"),
    open_days: varchar("open_days", { length: 255 })
      .array()
      .default([
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
        "Samedi",
        "Dimanche",
      ]), // Include weekend days too
    Campings: varchar("Campings", { length: 255 }).$type<CAMPSITES>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    titleIndex: index("must_see_title_idx").on(example.Title),
    campingIndex: index("must_see_camping_idx").on(example.Campings),
  }),
);

// Table for "À faire dans le coin"
export type LocalActivity = InferSelectModel<typeof localActivities>;

export const localActivities = createTable(
  "local_activity",
  {
    ID: integer("ID").primaryKey().generatedByDefaultAsIdentity().notNull(),
    Title: varchar("Title", { length: 256 }).notNull(),
    Description: text("Description"),
    Location: varchar("Location", { length: 255 }).notNull(),
    Category: varchar("Category", { length: 100 }), // e.g. "Restaurant", "Hiking", etc.
    Distance: varchar("Distance", { length: 50 }),
    Duration: varchar("Duration", { length: 50 }),
    ExternalUrl: varchar("ExternalUrl", { length: 512 }),
    opening_time: time("opening_time"),
    closing_time: time("closing_time"),
    open_days: varchar("open_days", { length: 255 })
      .array()
      .default([
        "Lundi",
        "Mardi",
        "Mercredi",
        "Jeudi",
        "Vendredi",
        "Samedi",
        "Dimanche",
      ]), // Default to all days
    Campings: varchar("Campings", { length: 255 }).$type<CAMPSITES>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    titleIndex: index("local_title_idx").on(example.Title),
    campingIndex: index("local_camping_idx").on(example.Campings),
    categoryIndex: index("local_category_idx").on(example.Category),
  }),
);

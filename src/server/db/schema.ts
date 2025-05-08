import { type CAMPSITES } from "~/app/components/Select";
import { type AdapterAccount } from "next-auth/adapters";
import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
  pgTableCreator,
  primaryKey,
  timestamp,
  integer,
  varchar,
  index,
  text,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `planicamping_${name}`);

export type Activity = InferSelectModel<typeof campsiteActivities>;

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
    Image: varchar("Image", { length: 512 }),
    Distance: varchar("Distance", { length: 50 }),
    Duration: varchar("Duration", { length: 50 }),
    ExternalUrl: varchar("ExternalUrl", { length: 512 }),
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
    Image: varchar("Image", { length: 512 }),
    Distance: varchar("Distance", { length: 50 }),
    Duration: varchar("Duration", { length: 50 }),
    ExternalUrl: varchar("ExternalUrl", { length: 512 }),
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

export const users = createTable("user", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("email_verified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  image: varchar("image", { length: 255 }),
});

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
    userIdIdx: index("account_user_id_idx").on(account.userId),
  }),
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  {
    sessionToken: varchar("session_token", { length: 255 })
      .notNull()
      .primaryKey(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => users.id),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (session) => ({
    userIdIdx: index("session_user_id_idx").on(session.userId),
  }),
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

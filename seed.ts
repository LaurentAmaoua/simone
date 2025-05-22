/**
 * Seed file for must-see activities and local activities
 * This will add sample records to the database.
 * Run this script with: npx tsx seed.ts
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "~/server/db/schema";
import { mustSeeActivities, localActivities } from "~/server/db/schema";

// Define the CAMPSITES enum directly here instead of importing from Select
// This avoids the CSS module import error
enum CAMPSITES {
  BELA_BASQUE = "Bela Basque",
  CAP_DE_BRÉHAT = "Cap de Bréhat",
  DOMAINE_DE_BRÉHADOUR = "Domaine de Bréhadour",
  L_OCÉAN_ET_SPA = "L'Océan & spa",
  LES_TRUFFIERES_DE_DORDOGNE = "Les Truffières de Dordogne",
  LA_POINTE_DE_SAINT_GILDAS = "La Pointe Saint-Gildas",
  LE_CARAVAN_ÎLE = "Le Caravan'île",
  LE_SUROIT = "Le Suroit",
  L_ÉTOILE_DE_MER = "L'Étoile de Mer",
  MANOIR_DE_KER_AN_POUL = "Manoir de Ker An Poul",
  PALMYRE_LOISIRS = "Palmyre Loisirs",
}

// Supabase connection URL
const SUPABASE_DB_URL =
  "postgresql://postgres.nveturzuplczgglzkxrt:zVpZtzgvWDZZRr787Mcr@aws-0-eu-west-2.pooler.supabase.com:5432/postgres";

// French weekdays
const weekdays = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

async function main() {
  // Create a direct database connection
  const conn = postgres(SUPABASE_DB_URL);
  const db = drizzle(conn, { schema });

  try {
    // Using direct db access
    // Get existing record counts
    const [mustSeeCount] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(mustSeeActivities);

    const [localCount] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(localActivities);

    console.log(`Found ${mustSeeCount?.count ?? 0} must-see activities`);
    console.log(`Found ${localCount?.count ?? 0} local activities`);

    // Update existing must-see activities with opening/closing times
    await db.execute(sql`
      UPDATE planicamping_must_see_activity 
      SET opening_time = '09:00'::time, closing_time = '17:00'::time
      WHERE opening_time IS NULL OR closing_time IS NULL
    `);

    // Update existing local activities with opening/closing times
    await db.execute(sql`
      UPDATE planicamping_local_activity
      SET opening_time = 
        CASE 
          WHEN "Category" = 'Restaurant' THEN '11:00'::time
          WHEN "Category" = 'Museum' THEN '10:00'::time
          WHEN "Category" = 'Park' THEN '08:00'::time
          ELSE '09:00'::time
        END,
      closing_time = 
        CASE 
          WHEN "Category" = 'Restaurant' THEN '22:00'::time
          WHEN "Category" = 'Museum' THEN '18:00'::time
          WHEN "Category" = 'Park' THEN '20:00'::time
          ELSE '18:00'::time
        END
      WHERE opening_time IS NULL OR closing_time IS NULL
    `);

    // Update existing must-see activities with varied open_days patterns
    // This will ensure diversity in the opening schedules
    const existingMustSeeActivities = await db
      .select({
        id: mustSeeActivities.ID,
      })
      .from(mustSeeActivities);

    for (const [i, activity] of existingMustSeeActivities.entries()) {
      const dayIdx = i % 7; // 0-6, gives us 7 different patterns
      let openDaysStr: string;

      if (dayIdx === 0) {
        // Open all week
        openDaysStr = "{Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche}";
      } else if (dayIdx === 1) {
        // Only weekdays
        openDaysStr = "{Lundi,Mardi,Mercredi,Jeudi,Vendredi}";
      } else if (dayIdx === 2) {
        // Closed Mondays (common for museums)
        openDaysStr = "{Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche}";
      } else if (dayIdx === 3) {
        // Weekend only
        openDaysStr = "{Samedi,Dimanche}";
      } else if (dayIdx === 4) {
        // Open Wednesday through Sunday
        openDaysStr = "{Mercredi,Jeudi,Vendredi,Samedi,Dimanche}";
      } else if (dayIdx === 5) {
        // Closed on Tuesday and Thursday
        openDaysStr = "{Lundi,Mercredi,Vendredi,Samedi,Dimanche}";
      } else {
        // Random pattern
        const daysOpen = weekdays.filter((_, idx) => idx % ((i % 3) + 2) === 0);
        openDaysStr = `{${daysOpen.join(",")}}`;
      }

      await db.execute(sql`
        UPDATE planicamping_must_see_activity
        SET open_days = ${sql`${openDaysStr}::varchar[]`}
        WHERE "ID" = ${activity.id}
      `);
    }

    // Update existing local activities with open_days based on categories
    const existingLocalActivities = await db
      .select({
        id: localActivities.ID,
        category: localActivities.Category,
      })
      .from(localActivities);

    for (const [i, activity] of existingLocalActivities.entries()) {
      let openDaysStr: string;
      const category = activity.category;

      if (category === "Restaurant") {
        // Restaurants typically closed on Mondays
        openDaysStr = "{Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche}";
      } else if (category === "Museum") {
        // Museums often closed on Mondays and sometimes Tuesdays
        const closedDay = i % 2 === 0 ? "Lundi" : "Mardi";
        const daysOpen = weekdays.filter((day) => day !== closedDay);
        openDaysStr = `{${daysOpen.join(",")}}`;
      } else if (category === "Park") {
        // Parks usually open every day
        openDaysStr = "{Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche}";
      } else if (category === "Hiking") {
        // Some hiking trails might be closed during maintenance days
        const maintenanceDay = weekdays[i % 7];
        const daysOpen = weekdays.filter((day) => day !== maintenanceDay);
        openDaysStr = `{${daysOpen.join(",")}}`;
      } else {
        // Default - open most days but with some variety
        const skipDay = i % 7;
        const daysOpen = weekdays.filter((_, idx) => idx !== skipDay);
        openDaysStr = `{${daysOpen.join(",")}}`;
      }

      await db.execute(sql`
        UPDATE planicamping_local_activity
        SET open_days = ${sql`${openDaysStr}::varchar[]`}
        WHERE "ID" = ${activity.id}
      `);
    }

    // Seed new must-see activities if less than 10 exist
    const targetMustSeeCount = 10;
    const currentMustSeeCount = Number(mustSeeCount?.count ?? 0);

    if (currentMustSeeCount < targetMustSeeCount) {
      const campingOptions = [
        CAMPSITES.BELA_BASQUE,
        CAMPSITES.CAP_DE_BRÉHAT,
        CAMPSITES.DOMAINE_DE_BRÉHADOUR,
      ];

      // Get the highest existing ID
      const [maxIdResult] = await db.execute(sql`
        SELECT MAX("ID") as max_id FROM planicamping_must_see_activity
      `);
      const maxId = Number(maxIdResult?.max_id) || 0;

      const newCount = targetMustSeeCount - currentMustSeeCount;
      console.log(
        `Adding ${newCount} new must-see activities starting from ID ${maxId + 1}`,
      );

      for (let i = 0; i < newCount; i++) {
        const newId = maxId + i + 1;
        const index = currentMustSeeCount + i;
        const camping = campingOptions[index % campingOptions.length];
        const openingHour = 9 + (index % 2);
        const closingHour = 17 + (index % 4);

        // Determine which days this activity is open
        // For variety, some must-see activities are only open certain days
        let openDaysStr: string;
        const dayIdx = index % 7; // 0 = all week, 1 = weekdays only, 2+ = varied schedules

        if (dayIdx === 0) {
          // Open all week
          openDaysStr = "{Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche}";
        } else if (dayIdx === 1) {
          // Only weekdays
          openDaysStr = "{Lundi,Mardi,Mercredi,Jeudi,Vendredi}";
        } else if (dayIdx === 2) {
          // Closed Mondays (common for museums)
          openDaysStr = "{Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche}";
        } else if (dayIdx === 3) {
          // Weekend only
          openDaysStr = "{Samedi,Dimanche}";
        } else {
          // Random weekday pattern
          const daysOpen = weekdays.filter((_, idx) => idx % dayIdx === 0);
          openDaysStr = `{${daysOpen.join(",")}}`;
        }

        await db.execute(sql`
          INSERT INTO planicamping_must_see_activity 
          ("ID", "Title", "Description", "Location", "Image", "Distance", "Duration", "ExternalUrl", "Campings", "opening_time", "closing_time", "open_days") 
          VALUES 
          (${newId},
           ${`Must-See Activity ${index + 1}`}, 
           ${`Description for must-see activity ${index + 1}`},
           ${`Location ${index + 1}`},
           ${`https://example.com/images/must-see-${index + 1}.jpg`},
           ${`${(index + 1) * 2}km`},
           ${`${index + 1} hour(s)`},
           ${`https://example.com/must-see/${index + 1}`},
           ${camping},
           ${`${openingHour}:00`}::time,
           ${`${closingHour}:00`}::time,
           ${sql`${openDaysStr}::varchar[]`})
        `);
      }
    }

    // Seed new local activities if less than 15 exist
    const targetLocalCount = 15;
    const currentLocalCount = Number(localCount?.count ?? 0);

    if (currentLocalCount < targetLocalCount) {
      const campingOptions = [
        CAMPSITES.BELA_BASQUE,
        CAMPSITES.CAP_DE_BRÉHAT,
        CAMPSITES.DOMAINE_DE_BRÉHADOUR,
      ];

      // Get the highest existing ID
      const [maxIdResult] = await db.execute(sql`
        SELECT MAX("ID") as max_id FROM planicamping_local_activity
      `);
      const maxId = Number(maxIdResult?.max_id) || 0;

      const categories = ["Restaurant", "Hiking", "Museum", "Beach", "Park"];
      const newCount = targetLocalCount - currentLocalCount;
      console.log(
        `Adding ${newCount} new local activities starting from ID ${maxId + 1}`,
      );

      for (let i = 0; i < newCount; i++) {
        const newId = maxId + i + 1;
        const index = currentLocalCount + i;
        const camping = campingOptions[index % campingOptions.length];
        const category = categories[index % categories.length];

        let openingHour = 9;
        let closingHour = 18;
        let openDaysStr: string;

        if (category === "Restaurant") {
          openingHour = 11 + (index % 2);
          closingHour = 21 + (index % 3);
          // Restaurants typically closed on Mondays
          openDaysStr = "{Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche}";
        } else if (category === "Museum") {
          openingHour = 10;
          closingHour = 18;
          // Museums often closed on Mondays and sometimes Tuesdays
          const closedDay = index % 2 === 0 ? "Lundi" : "Mardi";
          const daysOpen = weekdays.filter((day) => day !== closedDay);
          openDaysStr = `{${daysOpen.join(",")}}`;
        } else if (category === "Park") {
          openingHour = 7 + (index % 3);
          closingHour = 19 + (index % 3);
          // Parks usually open every day
          openDaysStr = "{Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche}";
        } else if (category === "Hiking") {
          // Some hiking trails might be closed during maintenance days
          const maintenanceDay = weekdays[index % 7];
          const daysOpen = weekdays.filter((day) => day !== maintenanceDay);
          openDaysStr = `{${daysOpen.join(",")}}`;
        } else {
          // Default - open most days
          openDaysStr = "{Lundi,Mardi,Mercredi,Jeudi,Vendredi,Samedi,Dimanche}";
        }

        await db.execute(sql`
          INSERT INTO planicamping_local_activity 
          ("ID", "Title", "Description", "Location", "Category", "Image", "Distance", "Duration", "ExternalUrl", "Campings", "opening_time", "closing_time", "open_days") 
          VALUES 
          (${newId},
           ${`Local Activity ${index + 1}`}, 
           ${`Description for local activity ${index + 1}`},
           ${`Local Location ${index + 1}`},
           ${category},
           ${`https://example.com/images/local-${index + 1}.jpg`},
           ${`${(index + 1) * 1.5}km`},
           ${`${(index + 0.5) * 30} min`},
           ${`https://example.com/local/${index + 1}`},
           ${camping},
           ${`${openingHour}:00`}::time,
           ${`${closingHour}:00`}::time,
           ${sql`${openDaysStr}::varchar[]`})
        `);
      }
    }

    console.log("Seed completed successfully!");
  } catch (error) {
    console.error("Error in seed operation:", error);
  } finally {
    // Close the connection when done
    await conn.end();
  }

  process.exit(0);
}

// Run the main function
void main();

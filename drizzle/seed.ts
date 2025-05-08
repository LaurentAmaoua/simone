import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  mustSeeActivities,
  localActivities,
  campsiteActivities,
} from "../src/server/db/schema";
import { CAMPSITES } from "../src/app/components/Select";

// Get the DATABASE_URL from command line or use a default
const DATABASE_URL = process.argv[2] ?? process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "Please provide DATABASE_URL as an argument: npx tsx drizzle/seed.ts <DATABASE_URL>",
  );
  process.exit(1);
}

async function main() {
  console.log("Connecting to database...");
  const conn = postgres(DATABASE_URL!);
  const db = drizzle(conn);

  console.log("Seeding must-see activities...");

  // Must-see activities seed data - using proper CAMPSITES enum values
  for (const camping of Object.values(CAMPSITES)) {
    await db.insert(mustSeeActivities).values([
      {
        Title: "Zoo de la Palmyre",
        Description:
          "Découvrez l'un des zoos les plus populaires de France, avec plus de 1600 animaux représentant 115 espèces différentes.",
        Location: "La Palmyre",
        Image:
          "https://www.zoo-palmyre.fr/sites/palmyre/files/styles/slide_home/public/2023-12/slide-homepage-general-2024.jpg",
        Distance: "5 km",
        Duration: "3-4 heures",
        ExternalUrl: "https://www.zoo-palmyre.fr/",
        Campings: camping,
      },
      {
        Title: "Phare de Cordouan",
        Description:
          "Le 'Roi des phares', inscrit au patrimoine mondial de l'UNESCO, est le plus ancien phare de France encore en activité.",
        Location: "Embouchure de l'estuaire de la Gironde",
        Image:
          "https://media.sudouest.fr/13294277/1000x500/phare-de-cordouan2-1.jpg",
        Distance: "30 km",
        Duration: "Demi-journée",
        ExternalUrl: "https://www.phare-de-cordouan.fr/",
        Campings: camping,
      },
      {
        Title: "Île d'Oléron",
        Description:
          "La plus grande île française de la côte Atlantique, avec ses plages, ses ports, sa citadelle et son phare de Chassiron.",
        Location: "Charente-Maritime",
        Image:
          "https://www.ile-oleron-marennes.com/wp-content/uploads/2019/10/ile-oleron-phare-chassiron-fotolia.jpg",
        Distance: "40 km",
        Duration: "Journée entière",
        ExternalUrl: "https://www.ile-oleron-marennes.com/",
        Campings: camping,
      },
    ]);
  }

  console.log("Seeding local activities...");

  // Local activities seed data - using proper CAMPSITES enum values
  const categories = [
    "Restaurants",
    "Plages",
    "Activités nautiques",
    "Randonnées",
  ];

  // Restaurants
  for (const camping of Object.values(CAMPSITES)) {
    await db.insert(localActivities).values([
      {
        Title: "La Cabane de l'Océan",
        Description:
          "Restaurant de fruits de mer avec vue panoramique sur l'océan",
        Location: "Plage de la Grande Côte",
        Category: "Restaurants",
        Image: "https://images.unsplash.com/photo-1559304822-9eb2813c9844",
        Distance: "3 km",
        Duration: "1-2 heures",
        ExternalUrl: "https://example.com/cabane-ocean",
        Campings: camping,
      },
      {
        Title: "L'Huître Gourmande",
        Description: "Dégustation d'huîtres fraîches et autres produits locaux",
        Location: "Port de La Tremblade",
        Category: "Restaurants",
        Image: "https://images.unsplash.com/photo-1604801074013-31882fe45e2e",
        Distance: "8 km",
        Duration: "1-2 heures",
        ExternalUrl: "https://example.com/huitre-gourmande",
        Campings: camping,
      },
      // Plages
      {
        Title: "Plage de la Côte Sauvage",
        Description:
          "Magnifique plage sauvage idéale pour le surf et les longues promenades",
        Location: "La Palmyre",
        Category: "Plages",
        Image: "https://images.unsplash.com/photo-1520942702018-0862200e6873",
        Distance: "2 km",
        Duration: "Demi-journée ou journée",
        ExternalUrl: "https://example.com/plage-cote-sauvage",
        Campings: camping,
      },
      {
        Title: "Plage de Bonne Anse",
        Description:
          "Plage familiale abritée dans une baie, idéale pour les enfants",
        Location: "La Palmyre",
        Category: "Plages",
        Image: "https://images.unsplash.com/photo-1520454974749-611b7248ffdb",
        Distance: "4 km",
        Duration: "Demi-journée ou journée",
        ExternalUrl: "https://example.com/plage-bonne-anse",
        Campings: camping,
      },
      // Activités nautiques
      {
        Title: "École de Voile",
        Description:
          "Cours de voile pour tous niveaux, location de catamarans et planches à voile",
        Location: "La Palmyre",
        Category: "Activités nautiques",
        Image: "https://images.unsplash.com/photo-1534438097545-a2c22c57f2ad",
        Distance: "3 km",
        Duration: "2-3 heures",
        ExternalUrl: "https://example.com/ecole-voile",
        Campings: camping,
      },
      {
        Title: "Location de Kayaks",
        Description:
          "Explorez la côte en kayak, avec possibilité de visites guidées",
        Location: "Port de Royan",
        Category: "Activités nautiques",
        Image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5",
        Distance: "12 km",
        Duration: "2-4 heures",
        ExternalUrl: "https://example.com/kayaks",
        Campings: camping,
      },
      // Randonnées
      {
        Title: "Sentier des Douaniers",
        Description:
          "Magnifique sentier côtier offrant des vues imprenables sur l'océan",
        Location: "La Palmyre - Royan",
        Category: "Randonnées",
        Image: "https://images.unsplash.com/photo-1522163723043-478ef79a5bb4",
        Distance: "1 km",
        Duration: "2-5 heures",
        ExternalUrl: "https://example.com/sentier-douaniers",
        Campings: camping,
      },
      {
        Title: "Forêt de la Coubre",
        Description:
          "Vaste forêt de pins avec nombreux sentiers de randonnée et pistes cyclables",
        Location: "La Palmyre",
        Category: "Randonnées",
        Image: "https://images.unsplash.com/photo-1503435980610-066b3022523d",
        Distance: "0.5 km",
        Duration: "1-3 heures",
        ExternalUrl: "https://example.com/foret-coubre",
        Campings: camping,
      },
    ]);
  }

  console.log("Seeding campsite activities...");

  // Seed campsite activities
  await db.insert(campsiteActivities).values([
    // Cap de Bréhat (PLOUEZEC)
    {
      Title: "Visite guidée du phare",
      infos_description:
        "Découvrez l'histoire fascinante du phare et profitez d'une vue panoramique exceptionnelle sur l'archipel de Bréhat et la côte.",
      Campings: CAMPSITES.CAP_DE_BRÉHAT,
      Contenu_date: new Date("2024-07-15"),
      Contenu_time: "10:00",
      useful_duration: "1h30",
    },
    {
      Title: "Atelier de cuisine bretonne",
      infos_description:
        "Apprenez à préparer des spécialités bretonnes traditionnelles avec notre chef local.",
      Campings: CAMPSITES.CAP_DE_BRÉHAT,
      Contenu_date: new Date("2024-07-16"),
      Contenu_time: "14:00",
      useful_duration: "2h",
    },

    // Manoir de Ker an Poul (SARZEAU)
    {
      Title: "Soirée fruits de mer",
      infos_description:
        "Dégustation de fruits de mer frais de la région accompagnés de vins locaux.",
      Campings: CAMPSITES.MANOIR_DE_KER_AN_POUL,
      Contenu_date: new Date("2024-07-20"),
      Contenu_time: "19:00",
      useful_duration: "3h",
    },
    {
      Title: "Excursion au Golfe du Morbihan",
      infos_description:
        "Découverte des îles du Golfe du Morbihan en bateau avec arrêt sur l'île aux Moines.",
      Campings: CAMPSITES.MANOIR_DE_KER_AN_POUL,
      Contenu_date: new Date("2024-07-22"),
      Contenu_time: "09:00",
      useful_duration: "5h",
    },

    // Domaine de Bréhadour (GUÉRANDE)
    {
      Title: "Visite des marais salants",
      infos_description:
        "Découvrez le métier de paludier et l'histoire du sel de Guérande avec un guide expert.",
      Campings: CAMPSITES.DOMAINE_DE_BRÉHADOUR,
      Contenu_date: new Date("2024-08-05"),
      Contenu_time: "10:00",
      useful_duration: "2h30",
    },
    {
      Title: "Balade à vélo dans les marais",
      infos_description:
        "Parcourez les marais salants à vélo sur un circuit balisé avec points de vue exceptionnels.",
      Campings: CAMPSITES.DOMAINE_DE_BRÉHADOUR,
      Contenu_date: new Date("2024-08-08"),
      Contenu_time: "09:00",
      useful_duration: "3h",
    },

    // La Pointe Saint-Gildas (PRÉFAILLES)
    {
      Title: "Initiation au surf",
      infos_description:
        "Cours d'initiation au surf pour tous niveaux avec instructeurs certifiés.",
      Campings: CAMPSITES.LA_POINTE_DE_SAINT_GILDAS,
      Contenu_date: new Date("2024-08-12"),
      Contenu_time: "11:00",
      useful_duration: "2h",
    },
    {
      Title: "Découverte de la pêche à pied",
      infos_description:
        "Apprenez à identifier et à récolter les coquillages et crustacés à marée basse.",
      Campings: CAMPSITES.LA_POINTE_DE_SAINT_GILDAS,
      Contenu_date: new Date("2024-08-14"),
      Contenu_time: "14:30",
      useful_duration: "1h30",
    },

    // L'Océan & Spa (ILE_DE_RÉ)
    {
      Title: "Dégustation de vins locaux",
      infos_description:
        "Découverte des vins de l'île de Ré avec un sommelier expert.",
      Campings: CAMPSITES.L_OCÉAN_ET_SPA,
      Contenu_date: new Date("2024-07-10"),
      Contenu_time: "18:00",
      useful_duration: "2h",
    },
    {
      Title: "Balade à cheval",
      infos_description:
        "Découvrez les plages et forêts de l'île de Ré à cheval, idéal pour tous niveaux.",
      Campings: CAMPSITES.L_OCÉAN_ET_SPA,
      Contenu_date: new Date("2024-07-14"),
      Contenu_time: "10:00",
      useful_duration: "2h",
    },

    // Palmyre Loisirs (LA_PALMYRE)
    {
      Title: "Animation pour enfants",
      infos_description:
        "Chasse au trésor thématique dans le camping pour les enfants de 5 à 12 ans.",
      Campings: CAMPSITES.PALMYRE_LOISIRS,
      Contenu_date: new Date("2024-08-20"),
      Contenu_time: "15:00",
      useful_duration: "2h",
    },
    {
      Title: "Tournoi de beach-volley",
      infos_description:
        "Compétition amicale de beach-volley ouverte à tous les campeurs.",
      Campings: CAMPSITES.PALMYRE_LOISIRS,
      Contenu_date: new Date("2024-08-22"),
      Contenu_time: "16:00",
      useful_duration: "3h",
    },

    // Add a few more activities for the remaining campsites
    {
      Title: "Cours de surf avancé",
      infos_description:
        "Perfectionnez votre technique de surf avec nos moniteurs professionnels.",
      Campings: CAMPSITES.BELA_BASQUE,
      Contenu_date: new Date("2024-07-25"),
      Contenu_time: "09:00",
      useful_duration: "2h",
    },
    {
      Title: "Chasse aux truffes",
      infos_description:
        "Partez à la recherche de truffes avec un chien truffier et son maître expérimenté.",
      Campings: CAMPSITES.LES_TRUFFIERES_DE_DORDOGNE,
      Contenu_date: new Date("2024-08-01"),
      Contenu_time: "10:00",
      useful_duration: "2h",
    },
    {
      Title: "Tournoi de pétanque",
      infos_description:
        "Compétition amicale de pétanque ouverte à tous les résidents du camping.",
      Campings: CAMPSITES.L_ÉTOILE_DE_MER,
      Contenu_date: new Date("2024-07-18"),
      Contenu_time: "17:00",
      useful_duration: "2h",
    },
  ]);

  console.log("Seeding completed successfully!");

  await conn.end();
}

main().catch((e) => {
  console.error("Error seeding database:", e);
  process.exit(1);
});

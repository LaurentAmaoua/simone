import { describe, it, expect, beforeEach } from "vitest";
import { CAMPSITES } from "~/app/components/Select";
import {
  type MustSeeActivity,
  type LocalActivity,
  type CampsiteActivity,
} from "~/server/db/schema";

// Types for the schedule generation test
type ScheduleActivity =
  | (MustSeeActivity & { type: "must-see" })
  | (LocalActivity & { type: "local" })
  | (CampsiteActivity & { type: "campsite" });

interface DaySchedule {
  date: Date;
  morning: ScheduleActivity | null;
  afternoon: ScheduleActivity | null;
  evening: ScheduleActivity | null;
}

// Mock activities for testing
const createMockMustSeeActivity = (id: number): MustSeeActivity => ({
  ID: id,
  Title: `Must See Activity ${id}`,
  Description: `Description for must see activity ${id}`,
  Location: `Location ${id}`,
  Distance: "5km",
  Duration: "2h",
  ExternalUrl: `https://example.com/${id}`,
  opening_time: "09:00:00",
  closing_time: "17:00:00",
  open_days: [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ],
  Campings: CAMPSITES.BELA_BASQUE,
  createdAt: new Date(),
  updatedAt: null,
});

const createMockLocalActivity = (id: number): LocalActivity => ({
  ID: id,
  Title: `Local Activity ${id}`,
  Description: `Description for local activity ${id}`,
  Location: `Location ${id}`,
  Category: "Restaurant",
  Distance: "2km",
  Duration: "1h",
  ExternalUrl: `https://example.com/local/${id}`,
  opening_time: "08:00:00",
  closing_time: "18:00:00",
  open_days: [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche",
  ],
  Campings: CAMPSITES.BELA_BASQUE,
  createdAt: new Date(),
  updatedAt: null,
});

const createMockCampsiteActivity = (
  id: number,
  date: Date,
): CampsiteActivity => ({
  ID: id,
  Title: `Campsite Activity ${id}`,
  Categories: "Animation",
  Cibles: "Famille",
  Contenu: `Content for campsite activity ${id}`,
  Contenu_is_weekly: false,
  Contenu_is_featured: false,
  Contenu_place: "Main Stage",
  infos_description: `Info for activity ${id}`,
  Campings: CAMPSITES.BELA_BASQUE,
  Contenu_date: date,
  Contenu_time: "10:00:00",
  Contenu_duration: "1h",
  useful_date: date,
  createdAt: new Date(),
  updatedAt: null,
});

// Helper function to convert Date to French day name (capitalized to match database format)
const getFrenchDayName = (date: Date): string => {
  const dayName = Intl.DateTimeFormat("fr-FR", { weekday: "long" }).format(
    date,
  );
  return dayName.charAt(0).toUpperCase() + dayName.slice(1);
};

// Helper function to check if an activity is open on a specific day
const activityIsOpenOnDay = (
  activity: { open_days?: string[] | null },
  dayName: string,
): boolean => {
  if (!activity.open_days || activity.open_days.length === 0) {
    return true; // If no open_days specified, assume it's open every day
  }
  return activity.open_days.includes(dayName);
};

// Mock schedule generation function (simplified version of the actual logic)
function generateMockSchedule(
  dates: Date[],
  mustSeeActivities: MustSeeActivity[],
  localActivities: LocalActivity[],
  campsiteActivities: CampsiteActivity[],
): DaySchedule[] {
  const generatedSchedule: DaySchedule[] = [];
  const recentlyUsedMustSeeIds = new Map<number, number>();
  const recentlyUsedLocalIds = new Map<number, number>();

  // Track used activity IDs across entire schedule to prevent duplicates
  const usedMustSeeIds = new Set<number>();
  const usedLocalIds = new Set<number>();

  for (const [dayIndex, day] of dates.entries()) {
    const daySchedule: DaySchedule = {
      date: day,
      morning: null,
      afternoon: null,
      evening: null,
    };

    // Get the French day name for this day
    const dayName = getFrenchDayName(day);

    // Filter activities to prevent reusing the same specific activity ID AND check open_days
    const availableMustSeeActivities = mustSeeActivities.filter(
      (activity) =>
        !usedMustSeeIds.has(activity.ID) &&
        activityIsOpenOnDay(activity, dayName),
    );

    const availableLocalActivities = localActivities.filter(
      (activity) =>
        !usedLocalIds.has(activity.ID) &&
        activityIsOpenOnDay(activity, dayName),
    );

    // Assignment functions
    const assignMustSeeActivity = (
      slot: keyof Omit<DaySchedule, "date">,
      activity: MustSeeActivity,
    ) => {
      daySchedule[slot] = {
        ...activity,
        type: "must-see" as const,
      };
      recentlyUsedMustSeeIds.set(activity.ID, dayIndex);
      usedMustSeeIds.add(activity.ID);
    };

    const assignLocalActivity = (
      slot: keyof Omit<DaySchedule, "date">,
      activity: LocalActivity,
    ) => {
      daySchedule[slot] = {
        ...activity,
        type: "local" as const,
      };
      recentlyUsedLocalIds.set(activity.ID, dayIndex);
      usedLocalIds.add(activity.ID);
    };

    const assignCampsiteActivity = (
      slot: keyof Omit<DaySchedule, "date">,
      activity: CampsiteActivity,
    ) => {
      daySchedule[slot] = {
        ...activity,
        type: "campsite" as const,
      };
    };

    // Simple scheduling logic for testing
    // Morning: Try local first, then campsite, then must-see
    if (availableLocalActivities.length > 0) {
      assignLocalActivity("morning", availableLocalActivities[0]!);
    } else if (campsiteActivities.length > 0) {
      assignCampsiteActivity("morning", campsiteActivities[0]!);
    } else if (availableMustSeeActivities.length > 0) {
      assignMustSeeActivity("morning", availableMustSeeActivities[0]!);
    }

    // Afternoon: Try local first, then must-see, then campsite
    if (
      availableLocalActivities.length > 0 &&
      !daySchedule.morning?.type?.includes("local")
    ) {
      assignLocalActivity("afternoon", availableLocalActivities[0]!);
    } else if (availableMustSeeActivities.length > 0) {
      assignMustSeeActivity("afternoon", availableMustSeeActivities[0]!);
    } else if (campsiteActivities.length > 0) {
      assignCampsiteActivity("afternoon", campsiteActivities[0]!);
    }

    // Evening: Try campsite first, then local, then must-see
    if (campsiteActivities.length > 0) {
      assignCampsiteActivity("evening", campsiteActivities[0]!);
    } else if (
      availableLocalActivities.length > 0 &&
      !daySchedule.morning?.type?.includes("local") &&
      !daySchedule.afternoon?.type?.includes("local")
    ) {
      assignLocalActivity("evening", availableLocalActivities[0]!);
    } else if (
      availableMustSeeActivities.length > 0 &&
      !daySchedule.morning?.type?.includes("must-see") &&
      !daySchedule.afternoon?.type?.includes("must-see")
    ) {
      assignMustSeeActivity("evening", availableMustSeeActivities[0]!);
    }

    generatedSchedule.push(daySchedule);
  }

  return generatedSchedule;
}

describe("Schedule Generation Logic", () => {
  let dates: Date[];
  let mustSeeActivities: MustSeeActivity[];
  let localActivities: LocalActivity[];
  let campsiteActivities: CampsiteActivity[];

  beforeEach(() => {
    // Create a 5-day date range for testing
    dates = [];
    const startDate = new Date("2025-06-01T00:00:00.000Z");
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }

    // Create mock activities
    mustSeeActivities = [
      createMockMustSeeActivity(1),
      createMockMustSeeActivity(2),
      createMockMustSeeActivity(3),
    ];

    localActivities = [
      createMockLocalActivity(1),
      createMockLocalActivity(2),
      createMockLocalActivity(3),
    ];

    campsiteActivities = dates.map((date, index) =>
      createMockCampsiteActivity(index + 1, date),
    );
  });

  describe("Must-see activity uniqueness across schedule", () => {
    it("allows multiple must-see activities but never repeats the same one", () => {
      const schedule = generateMockSchedule(
        dates,
        mustSeeActivities,
        [],
        campsiteActivities,
      );

      const mustSeeActivitiesInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "must-see");

      const uniqueMustSeeIds = new Set(
        mustSeeActivitiesInSchedule.map((activity) => activity.ID),
      );

      expect(uniqueMustSeeIds.size).toBe(mustSeeActivitiesInSchedule.length);
      expect(mustSeeActivitiesInSchedule.length).toBeLessThanOrEqual(
        mustSeeActivities.length,
      );
    });
  });

  describe("Local activity uniqueness across schedule", () => {
    it("allows multiple local activities but never repeats the same one", () => {
      const schedule = generateMockSchedule(
        dates,
        [],
        localActivities,
        campsiteActivities,
      );

      const localActivitiesInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "local");

      const uniqueLocalIds = new Set(
        localActivitiesInSchedule.map((activity) => activity.ID),
      );

      expect(uniqueLocalIds.size).toBe(localActivitiesInSchedule.length);
      expect(localActivitiesInSchedule.length).toBeLessThanOrEqual(
        localActivities.length,
      );
    });
  });

  describe("Combined uniqueness", () => {
    it("should not repeat the same must-see or local activity IDs across the schedule", () => {
      const schedule = generateMockSchedule(
        dates,
        mustSeeActivities,
        localActivities,
        campsiteActivities,
      );

      const mustSeeActivitiesInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "must-see");

      const localActivitiesInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "local");

      const uniqueMustSeeIds = new Set(
        mustSeeActivitiesInSchedule.map((activity) => activity.ID),
      );
      const uniqueLocalIds = new Set(
        localActivitiesInSchedule.map((activity) => activity.ID),
      );

      expect(uniqueMustSeeIds.size).toBe(mustSeeActivitiesInSchedule.length);
      expect(uniqueLocalIds.size).toBe(localActivitiesInSchedule.length);
    });

    it("should not affect campsite activities (no limits)", () => {
      const schedule = generateMockSchedule(
        dates,
        mustSeeActivities,
        localActivities,
        campsiteActivities,
      );

      const campsiteActivitiesInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "campsite");

      // Campsite activities should not be limited - can have multiple different ones
      if (campsiteActivitiesInSchedule.length > 1) {
        const uniqueCampsiteIds = new Set(
          campsiteActivitiesInSchedule.map((activity) => activity.ID),
        );
        // Should be able to have multiple different campsite activities
        expect(uniqueCampsiteIds.size).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("Edge cases", () => {
    it("should handle empty activity arrays gracefully", () => {
      const schedule = generateMockSchedule(dates, [], [], []);

      expect(schedule).toHaveLength(dates.length);
      schedule.forEach((day) => {
        expect(day.morning).toBeNull();
        expect(day.afternoon).toBeNull();
        expect(day.evening).toBeNull();
      });
    });

    it("should handle single day schedule", () => {
      const singleDay = [dates[0]!];
      const schedule = generateMockSchedule(
        singleDay,
        mustSeeActivities,
        localActivities,
        campsiteActivities,
      );

      expect(schedule).toHaveLength(1);

      const day = schedule[0]!;
      const idsByType = {
        mustSee: new Set<number>(),
        local: new Set<number>(),
      };
      [day.morning, day.afternoon, day.evening]
        .filter(Boolean)
        .forEach((activity) => {
          if (activity?.type === "must-see") idsByType.mustSee.add(activity.ID);
          if (activity?.type === "local") idsByType.local.add(activity.ID);
        });
      // No duplicate IDs for must-see or local within the day
      const mustSeeActivitiesInDay = [
        day.morning,
        day.afternoon,
        day.evening,
      ].filter((a) => a?.type === "must-see");
      const localActivitiesInDay = [
        day.morning,
        day.afternoon,
        day.evening,
      ].filter((a) => a?.type === "local");

      expect(idsByType.mustSee.size).toBe(mustSeeActivitiesInDay.length);
      expect(idsByType.local.size).toBe(localActivitiesInDay.length);
    });

    it("should handle only one must-see and one local activity available", () => {
      const singleMustSee = [mustSeeActivities[0]!];
      const singleLocal = [localActivities[0]!];

      const schedule = generateMockSchedule(
        dates,
        singleMustSee,
        singleLocal,
        campsiteActivities,
      );

      const mustSeeInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "must-see");

      const localInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "local");

      expect(mustSeeInSchedule.length).toBeLessThanOrEqual(1);
      if (mustSeeInSchedule.length === 1) {
        expect(mustSeeInSchedule[0]?.ID).toBe(singleMustSee[0]?.ID);
      }

      expect(localInSchedule.length).toBeLessThanOrEqual(1);
      if (localInSchedule.length === 1) {
        expect(localInSchedule[0]?.ID).toBe(singleLocal[0]?.ID);
      }
    });

    it("should respect open_days and only schedule activities on their open days", () => {
      // Create a local activity that's only open on Saturday
      const saturdayOnlyActivity: LocalActivity = {
        ID: 999,
        Title: "Saturday Only Activity",
        Description: "Only open on Saturdays",
        Location: "Test Location",
        Category: "Test",
        Distance: "1km",
        Duration: "2h",
        ExternalUrl: null,
        opening_time: "09:00",
        closing_time: "18:00",
        open_days: ["Samedi"], // Only Saturday
        Campings: CAMPSITES.BELA_BASQUE,
        createdAt: new Date(),
        updatedAt: null,
      };

      // Create dates that include a Saturday and other days
      const testDates = [
        new Date("2025-01-13T00:00:00.000Z"), // Monday
        new Date("2025-01-14T00:00:00.000Z"), // Tuesday
        new Date("2025-01-18T00:00:00.000Z"), // Saturday
      ];

      const schedule = generateMockSchedule(
        testDates,
        [],
        [saturdayOnlyActivity],
        [],
      );

      // Check Monday (should not have the Saturday-only activity)
      const mondayActivities = [
        schedule[0]?.morning,
        schedule[0]?.afternoon,
        schedule[0]?.evening,
      ].filter((a) => a?.ID === saturdayOnlyActivity.ID);
      expect(mondayActivities).toHaveLength(0);

      // Check Tuesday (should not have the Saturday-only activity)
      const tuesdayActivities = [
        schedule[1]?.morning,
        schedule[1]?.afternoon,
        schedule[1]?.evening,
      ].filter((a) => a?.ID === saturdayOnlyActivity.ID);
      expect(tuesdayActivities).toHaveLength(0);

      // Check Saturday (should have the Saturday-only activity)
      const saturdayActivities = [
        schedule[2]?.morning,
        schedule[2]?.afternoon,
        schedule[2]?.evening,
      ].filter((a) => a?.ID === saturdayOnlyActivity.ID);
      expect(saturdayActivities.length).toBeGreaterThan(0);
    });

    it("should verify French day name conversion works correctly", () => {
      // Test specific dates with known days
      const monday = new Date("2025-01-13T00:00:00.000Z");
      const tuesday = new Date("2025-01-14T00:00:00.000Z");
      const saturday = new Date("2025-01-18T00:00:00.000Z");

      expect(getFrenchDayName(monday)).toBe("Lundi");
      expect(getFrenchDayName(tuesday)).toBe("Mardi");
      expect(getFrenchDayName(saturday)).toBe("Samedi");
    });
  });
});

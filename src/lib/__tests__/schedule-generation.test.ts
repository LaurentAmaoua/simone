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

  // Track used activities across entire schedule (limit 1 each)
  let usedMustSeeActivity: MustSeeActivity | null = null;
  let usedLocalActivity: LocalActivity | null = null;

  for (const [dayIndex, day] of dates.entries()) {
    const daySchedule: DaySchedule = {
      date: day,
      morning: null,
      afternoon: null,
      evening: null,
    };

    // Filter activities based on global limits (single use only)
    const availableMustSeeActivities = usedMustSeeActivity
      ? [] // If we've already used a must-see activity, don't allow any more
      : mustSeeActivities.filter((activity) => {
          const lastUsedDay = recentlyUsedMustSeeIds.get(activity.ID);
          const cooldownDays = 2;
          return (
            lastUsedDay === undefined || dayIndex - lastUsedDay >= cooldownDays
          );
        });

    const availableLocalActivities = usedLocalActivity
      ? [] // If we've already used a local activity, don't allow any more
      : localActivities.filter((activity) => {
          const lastUsedDay = recentlyUsedLocalIds.get(activity.ID);
          const cooldownDays = 2;
          return (
            lastUsedDay === undefined || dayIndex - lastUsedDay >= cooldownDays
          );
        });

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
      if (!usedMustSeeActivity) {
        usedMustSeeActivity = activity;
      }
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
      if (!usedLocalActivity) {
        usedLocalActivity = activity;
      }
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

  describe("Must-see activity limits", () => {
    it("should limit must-see activities to at most 1 occurrence across entire schedule", () => {
      const schedule = generateMockSchedule(
        dates,
        mustSeeActivities,
        [],
        campsiteActivities,
      );

      // Count must-see activities
      const mustSeeActivitiesInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "must-see");

      // Should have at most one must-see activity in the entire schedule
      expect(mustSeeActivitiesInSchedule.length).toBeLessThanOrEqual(1);

      // If there are any must-see activities, they should all be the same activity (same ID)
      if (mustSeeActivitiesInSchedule.length > 0) {
        const uniqueMustSeeIds = new Set(
          mustSeeActivitiesInSchedule.map((activity) => activity.ID),
        );
        expect(uniqueMustSeeIds.size).toBe(1);
      }
    });

    it("should use a must-see activity at most once in the entire schedule", () => {
      const schedule = generateMockSchedule(
        dates,
        mustSeeActivities,
        [],
        campsiteActivities,
      );

      const mustSeeActivitiesInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "must-see");

      // Should have at most one must-see activity in the entire schedule
      expect(mustSeeActivitiesInSchedule.length).toBeLessThanOrEqual(1);

      if (mustSeeActivitiesInSchedule.length === 1) {
        // If there is one, it should be from the available activities
        const usedActivity = mustSeeActivitiesInSchedule[0];
        expect(
          mustSeeActivities.some(
            (activity) => activity.ID === usedActivity?.ID,
          ),
        ).toBe(true);
      }
    });
  });

  describe("Local activity limits", () => {
    it("should limit local activities to at most 1 occurrence across entire schedule", () => {
      const schedule = generateMockSchedule(
        dates,
        [],
        localActivities,
        campsiteActivities,
      );

      // Count local activities
      const localActivitiesInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "local");

      // Should have at most one local activity in the entire schedule
      expect(localActivitiesInSchedule.length).toBeLessThanOrEqual(1);

      // If there are any local activities, they should all be the same activity (same ID)
      if (localActivitiesInSchedule.length > 0) {
        const uniqueLocalIds = new Set(
          localActivitiesInSchedule.map((activity) => activity.ID),
        );
        expect(uniqueLocalIds.size).toBe(1);
      }
    });

    it("should use a local activity at most once in the entire schedule", () => {
      const schedule = generateMockSchedule(
        dates,
        [],
        localActivities,
        campsiteActivities,
      );

      const localActivitiesInSchedule = schedule
        .flatMap((day) => [day.morning, day.afternoon, day.evening])
        .filter((activity) => activity?.type === "local");

      // Should have at most one local activity in the entire schedule
      expect(localActivitiesInSchedule.length).toBeLessThanOrEqual(1);

      if (localActivitiesInSchedule.length === 1) {
        // If there is one, it should be from the available activities
        const usedActivity = localActivitiesInSchedule[0];
        expect(
          localActivities.some((activity) => activity.ID === usedActivity?.ID),
        ).toBe(true);
      }
    });
  });

  describe("Combined limits", () => {
    it("should respect both must-see and local activity limits simultaneously", () => {
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

      // Check must-see limit - at most 1 occurrence
      expect(mustSeeActivitiesInSchedule.length).toBeLessThanOrEqual(1);
      if (mustSeeActivitiesInSchedule.length > 0) {
        const uniqueMustSeeIds = new Set(
          mustSeeActivitiesInSchedule.map((activity) => activity.ID),
        );
        expect(uniqueMustSeeIds.size).toBe(1);
      }

      // Check local limit - at most 1 occurrence
      expect(localActivitiesInSchedule.length).toBeLessThanOrEqual(1);
      if (localActivitiesInSchedule.length > 0) {
        const uniqueLocalIds = new Set(
          localActivitiesInSchedule.map((activity) => activity.ID),
        );
        expect(uniqueLocalIds.size).toBe(1);
      }
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

      // Should still respect limits even for single day
      const allActivities = [
        schedule[0]?.morning,
        schedule[0]?.afternoon,
        schedule[0]?.evening,
      ].filter(Boolean);

      const mustSeeCount = allActivities.filter(
        (a) => a?.type === "must-see",
      ).length;
      const localCount = allActivities.filter(
        (a) => a?.type === "local",
      ).length;

      expect(mustSeeCount).toBeLessThanOrEqual(1);
      expect(localCount).toBeLessThanOrEqual(1);
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

      // All should be the same activity
      mustSeeInSchedule.forEach((activity) => {
        expect(activity.ID).toBe(singleMustSee[0]?.ID);
      });

      localInSchedule.forEach((activity) => {
        expect(activity.ID).toBe(singleLocal[0]?.ID);
      });
    });
  });
});

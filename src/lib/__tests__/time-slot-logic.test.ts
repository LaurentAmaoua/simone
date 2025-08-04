import { describe, it, expect } from "vitest";

// Types for activity and time slots
interface TimeSlot {
  start: string;
  end: string;
}

interface Activity {
  opening_time?: string | null;
  closing_time?: string | null;
}

type TimeSlotKey = "morning" | "afternoon" | "evening";

const TIME_SLOTS: Record<TimeSlotKey, TimeSlot> = {
  morning: { start: "06:00:00", end: "11:59:59" },
  afternoon: { start: "12:00:00", end: "17:59:59" },
  evening: { start: "18:00:00", end: "05:59:59" },
};

const safeParseInt = (
  value: string | undefined | null,
  defaultValue = 0,
): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Time slot logic function (matches the implementation in activity.ts)
const activityFitsTimeSlot = (
  activity: Activity,
  slot: TimeSlotKey,
): boolean => {
  if (!activity.opening_time || !activity.closing_time) {
    return true;
  }

  const slotTime = TIME_SLOTS[slot];

  // Parse times properly
  const openingHour = safeParseInt(activity.opening_time.split(":")[0], 9);
  const closingHour = safeParseInt(activity.closing_time.split(":")[0], 17);
  const slotStartHour = safeParseInt(slotTime.start.split(":")[0], 6);

  // For slot end, treat "17:59:59" as effective hour 18 for overlap calculations
  let slotEndHour = safeParseInt(slotTime.end.split(":")[0], 18);
  if (slotTime.end.includes("59:59")) {
    slotEndHour += 1;
  }

  // Handle evening case which crosses midnight (18:00-05:59)
  if (slot === "evening") {
    // Activity fits if it's open during evening hours (18:00-23:59) OR early morning hours (00:00-05:59)
    const openDuringEvening = openingHour <= 23 && closingHour > 18;
    const openDuringEarlyMorning =
      openingHour <= 5 && closingHour > openingHour;
    return openDuringEvening || openDuringEarlyMorning;
  }

  // For morning and afternoon, check for overlap: activity is available if it overlaps with the slot
  // Overlap exists if: activity_start < slot_end AND activity_end > slot_start
  return openingHour < slotEndHour && closingHour > slotStartHour;
};

describe("Time Slot Logic", () => {
  describe("Activity scheduling in time slots", () => {
    it("should correctly place activity open 08:00-18:00 in morning and afternoon", () => {
      const activity: Activity = {
        opening_time: "08:00",
        closing_time: "18:00",
      };

      expect(activityFitsTimeSlot(activity, "morning")).toBe(true);
      expect(activityFitsTimeSlot(activity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot(activity, "evening")).toBe(false); // Closes exactly when evening starts
    });

    it("should correctly place activity open 14:00-20:00 in afternoon and evening", () => {
      const activity: Activity = {
        opening_time: "14:00",
        closing_time: "20:00",
      };

      expect(activityFitsTimeSlot(activity, "morning")).toBe(false);
      expect(activityFitsTimeSlot(activity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot(activity, "evening")).toBe(true);
    });

    it("should correctly handle activities that span multiple time slots", () => {
      const allDayActivity: Activity = {
        opening_time: "08:00",
        closing_time: "22:00",
      };

      expect(activityFitsTimeSlot(allDayActivity, "morning")).toBe(true);
      expect(activityFitsTimeSlot(allDayActivity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot(allDayActivity, "evening")).toBe(true);
    });

    it("should correctly handle morning-only activities", () => {
      const morningActivity: Activity = {
        opening_time: "09:00",
        closing_time: "11:00",
      };

      expect(activityFitsTimeSlot(morningActivity, "morning")).toBe(true);
      expect(activityFitsTimeSlot(morningActivity, "afternoon")).toBe(false);
      expect(activityFitsTimeSlot(morningActivity, "evening")).toBe(false);
    });

    it("should correctly handle afternoon-only activities", () => {
      const afternoonActivity: Activity = {
        opening_time: "13:00",
        closing_time: "16:00",
      };

      expect(activityFitsTimeSlot(afternoonActivity, "morning")).toBe(false);
      expect(activityFitsTimeSlot(afternoonActivity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot(afternoonActivity, "evening")).toBe(false);
    });

    it("should correctly handle evening-only activities", () => {
      const eveningActivity: Activity = {
        opening_time: "19:00",
        closing_time: "23:00",
      };

      expect(activityFitsTimeSlot(eveningActivity, "morning")).toBe(false);
      expect(activityFitsTimeSlot(eveningActivity, "afternoon")).toBe(false);
      expect(activityFitsTimeSlot(eveningActivity, "evening")).toBe(true);
    });

    it("should handle activities with no opening/closing times", () => {
      const noTimeActivity: Activity = {
        opening_time: null,
        closing_time: null,
      };

      // Should default to being available for all slots
      expect(activityFitsTimeSlot(noTimeActivity, "morning")).toBe(true);
      expect(activityFitsTimeSlot(noTimeActivity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot(noTimeActivity, "evening")).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle activity that closes exactly when slot starts", () => {
      const edgeActivity: Activity = {
        opening_time: "10:00",
        closing_time: "12:00", // Closes exactly when afternoon starts
      };

      expect(activityFitsTimeSlot(edgeActivity, "morning")).toBe(true);
      expect(activityFitsTimeSlot(edgeActivity, "afternoon")).toBe(false); // No overlap
      expect(activityFitsTimeSlot(edgeActivity, "evening")).toBe(false);
    });

    it("should handle activity that opens exactly when slot starts", () => {
      const edgeActivity: Activity = {
        opening_time: "18:00", // Opens exactly when evening starts
        closing_time: "20:00",
      };

      expect(activityFitsTimeSlot(edgeActivity, "morning")).toBe(false);
      expect(activityFitsTimeSlot(edgeActivity, "afternoon")).toBe(false);
      expect(activityFitsTimeSlot(edgeActivity, "evening")).toBe(true);
    });

    it("should handle activity that spans morning-afternoon boundary", () => {
      const spanActivity: Activity = {
        opening_time: "11:00", // During morning
        closing_time: "13:00", // During afternoon
      };

      expect(activityFitsTimeSlot(spanActivity, "morning")).toBe(true);
      expect(activityFitsTimeSlot(spanActivity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot(spanActivity, "evening")).toBe(false);
    });

    it("should handle activity that spans afternoon-evening boundary", () => {
      const spanActivity: Activity = {
        opening_time: "17:00", // During afternoon
        closing_time: "19:00", // During evening
      };

      expect(activityFitsTimeSlot(spanActivity, "morning")).toBe(false);
      expect(activityFitsTimeSlot(spanActivity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot(spanActivity, "evening")).toBe(true);
    });
  });
});
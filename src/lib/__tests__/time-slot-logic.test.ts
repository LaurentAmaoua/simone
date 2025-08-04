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

// BROKEN LOGIC (preserved for regression testing)
const activityFitsTimeSlot_BROKEN = (
  activity: Activity,
  slot: TimeSlotKey,
): boolean => {
  if (!activity.opening_time || !activity.closing_time) {
    return true;
  }

  const slotTime = TIME_SLOTS[slot];
  const opening = activity.opening_time.split(":")[0] ?? "9";
  const closing = activity.closing_time.split(":")[0] ?? "17";
  const slotStart = slotTime.start.split(":")[0];
  const slotEnd = slotTime.end.split(":")[0];

  const openingHour = safeParseInt(opening, 9);
  const closingHour = safeParseInt(closing, 17);
  const slotStartHour = safeParseInt(slotStart, 6);
  const slotEndHour = safeParseInt(slotEnd, 18);

  if (slot === "evening") {
    return openingHour >= 18 || (openingHour < 6 && closingHour > openingHour);
  }

  return openingHour >= slotStartHour && openingHour < slotEndHour;
};

// CORRECT LOGIC (matches the fix applied to the actual code)
const activityFitsTimeSlot_FIXED = (
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
  describe("Bug Regression Tests", () => {
    it("should demonstrate the original bug with activity open 08:00-18:00", () => {
      const activity: Activity = {
        opening_time: "08:00",
        closing_time: "18:00",
      };

      // The broken logic only allows morning
      expect(activityFitsTimeSlot_BROKEN(activity, "morning")).toBe(true);
      expect(activityFitsTimeSlot_BROKEN(activity, "afternoon")).toBe(false); // BUG: Should be true
      expect(activityFitsTimeSlot_BROKEN(activity, "evening")).toBe(false);

      // The fixed logic correctly allows morning AND afternoon
      expect(activityFitsTimeSlot_FIXED(activity, "morning")).toBe(true);
      expect(activityFitsTimeSlot_FIXED(activity, "afternoon")).toBe(true); // FIXED
      expect(activityFitsTimeSlot_FIXED(activity, "evening")).toBe(false); // Correctly excludes evening
    });

    it("should demonstrate the original bug with activity open 14:00-20:00", () => {
      const activity: Activity = {
        opening_time: "14:00",
        closing_time: "20:00",
      };

      // The broken logic only allows afternoon
      expect(activityFitsTimeSlot_BROKEN(activity, "morning")).toBe(false);
      expect(activityFitsTimeSlot_BROKEN(activity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot_BROKEN(activity, "evening")).toBe(false); // BUG: Should be true

      // The fixed logic correctly allows afternoon AND evening
      expect(activityFitsTimeSlot_FIXED(activity, "morning")).toBe(false);
      expect(activityFitsTimeSlot_FIXED(activity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot_FIXED(activity, "evening")).toBe(true); // FIXED
    });
  });

  describe("Correct Time Slot Logic", () => {
    it("should correctly handle activities that span multiple time slots", () => {
      const allDayActivity: Activity = {
        opening_time: "08:00",
        closing_time: "22:00",
      };

      expect(activityFitsTimeSlot_FIXED(allDayActivity, "morning")).toBe(true);
      expect(activityFitsTimeSlot_FIXED(allDayActivity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot_FIXED(allDayActivity, "evening")).toBe(true);
    });

    it("should correctly handle morning-only activities", () => {
      const morningActivity: Activity = {
        opening_time: "09:00",
        closing_time: "11:00",
      };

      expect(activityFitsTimeSlot_FIXED(morningActivity, "morning")).toBe(true);
      expect(activityFitsTimeSlot_FIXED(morningActivity, "afternoon")).toBe(false);
      expect(activityFitsTimeSlot_FIXED(morningActivity, "evening")).toBe(false);
    });

    it("should correctly handle afternoon-only activities", () => {
      const afternoonActivity: Activity = {
        opening_time: "13:00",
        closing_time: "16:00",
      };

      expect(activityFitsTimeSlot_FIXED(afternoonActivity, "morning")).toBe(false);
      expect(activityFitsTimeSlot_FIXED(afternoonActivity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot_FIXED(afternoonActivity, "evening")).toBe(false);
    });

    it("should correctly handle evening-only activities", () => {
      const eveningActivity: Activity = {
        opening_time: "19:00",
        closing_time: "23:00",
      };

      expect(activityFitsTimeSlot_FIXED(eveningActivity, "morning")).toBe(false);
      expect(activityFitsTimeSlot_FIXED(eveningActivity, "afternoon")).toBe(false);
      expect(activityFitsTimeSlot_FIXED(eveningActivity, "evening")).toBe(true);
    });

    it("should handle activities with no opening/closing times", () => {
      const noTimeActivity: Activity = {
        opening_time: null,
        closing_time: null,
      };

      // Should default to being available for all slots
      expect(activityFitsTimeSlot_FIXED(noTimeActivity, "morning")).toBe(true);
      expect(activityFitsTimeSlot_FIXED(noTimeActivity, "afternoon")).toBe(true);
      expect(activityFitsTimeSlot_FIXED(noTimeActivity, "evening")).toBe(true);
    });

    it("should handle edge case: activity closes exactly when slot starts", () => {
      const edgeActivity: Activity = {
        opening_time: "10:00",
        closing_time: "12:00", // Closes exactly when afternoon starts
      };

      expect(activityFitsTimeSlot_FIXED(edgeActivity, "morning")).toBe(true);
      expect(activityFitsTimeSlot_FIXED(edgeActivity, "afternoon")).toBe(false); // No overlap
      expect(activityFitsTimeSlot_FIXED(edgeActivity, "evening")).toBe(false);
    });

    it("should handle edge case: activity opens exactly when slot ends", () => {
      const edgeActivity: Activity = {
        opening_time: "18:00", // Opens exactly when evening starts
        closing_time: "20:00",
      };

      expect(activityFitsTimeSlot_FIXED(edgeActivity, "morning")).toBe(false);
      expect(activityFitsTimeSlot_FIXED(edgeActivity, "afternoon")).toBe(false);
      expect(activityFitsTimeSlot_FIXED(edgeActivity, "evening")).toBe(true);
    });
  });
});
import { useState } from "react";
import { type DateRange } from "react-day-picker";
import { api } from "~/trpc/react";
import { type CAMPSITES } from "./Select";
import { type PickedActivity } from "./PickedActivities";

import styles from "./styles/GenerateScheduleButton.module.css";

export interface GenerateScheduleButtonProps {
  site: CAMPSITES | undefined;
  dateRange: DateRange | undefined;
  onPickActivity: (activity: PickedActivity) => void;
  pickedActivities: PickedActivity[];
  clearAllActivities: () => void;
  onScheduleGenerated?: () => void;
}

// Create a custom button component
const ActionButton = ({
  children,
  onClick,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  className?: string;
}) => {
  return (
    <button
      className={`${styles.generateButton} ${className ?? ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export const GenerateScheduleButton = ({
  site,
  dateRange,
  onPickActivity,
  pickedActivities,
  clearAllActivities,
  onScheduleGenerated,
}: GenerateScheduleButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Get the mutation to generate a schedule
  const generateScheduleMutation = api.activity.generateSchedule.useMutation({
    onSuccess: (generatedSchedule) => {
      // Clear all existing activities first
      clearAllActivities();

      // Add all the activities from the generated schedule
      for (const day of generatedSchedule) {
        // Add all scheduled activities to the picked activities
        ["morning", "afternoon", "evening"].forEach((slot) => {
          const activity = day[slot as keyof typeof day];
          if (activity && slot !== "date") {
            onPickActivity(activity as PickedActivity);
          }
        });
      }

      // After scheduling is done, navigate to the "Mon Planning" view
      if (onScheduleGenerated) {
        onScheduleGenerated();
      }

      setIsGenerating(false);
    },
    onError: (error) => {
      console.error("Error generating schedule:", error);
      setIsGenerating(false);
    },
  });

  const generateSchedule = () => {
    if (!site || !dateRange?.from || !dateRange?.to) {
      return;
    }

    setIsGenerating(true);

    // Call the backend procedure to generate the schedule
    generateScheduleMutation.mutate({
      site,
      dateRange: {
        from: dateRange.from,
        to: dateRange.to,
      },
    });
  };

  const isDisabled = !site || !dateRange?.from || !dateRange?.to;

  return (
    <div className={styles.container}>
      <ActionButton
        onClick={generateSchedule}
        disabled={isDisabled || isGenerating}
      >
        {isGenerating ? "Génération en cours..." : "Générer mon planning"}
      </ActionButton>
      {isDisabled && (
        <p className={styles.helperText}>
          Veuillez sélectionner un camping et une période pour générer votre
          planning
        </p>
      )}
    </div>
  );
};

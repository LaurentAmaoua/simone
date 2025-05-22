import { useState } from "react";
import { type DateRange } from "react-day-picker";
import { api } from "~/trpc/react";
import { type CAMPSITES } from "./Select";
import { GeneratedSchedule } from "./GeneratedSchedule";
import { type DaySchedule } from "~/server/api/routers/activity";

import styles from "./styles/GenerateScheduleButton.module.css";

export interface GenerateScheduleButtonProps {
  site: CAMPSITES | undefined;
  dateRange: DateRange | undefined;
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
}: GenerateScheduleButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[] | null>(null);

  // Get the mutation to generate a schedule
  const generateScheduleMutation = api.activity.generateSchedule.useMutation({
    onSuccess: (generatedSchedule) => {
      setSchedule(generatedSchedule);
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
      <div className={styles.generatedScheduleContainer}>
        {schedule && (
          <GeneratedSchedule schedule={schedule} isLoading={isGenerating} />
        )}
      </div>
    </div>
  );
};

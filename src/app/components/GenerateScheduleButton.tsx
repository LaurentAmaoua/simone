import { useState, useEffect } from "react";
import { type DateRange } from "react-day-picker";
import { api } from "~/trpc/react";
import { type CAMPSITES } from "./Select";
import { GeneratedSchedule } from "./GeneratedSchedule";
import { type DaySchedule } from "~/server/api/routers/activity";

import styles from "./styles/GenerateScheduleButton.module.css";
import { Button } from "./Button";

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
    <Button
      className={`${styles.generateButton} ${className ?? ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

export const GenerateScheduleButton = ({
  site,
  dateRange,
}: GenerateScheduleButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [schedule, setSchedule] = useState<DaySchedule[] | null>(null);

  // Clear schedule when site or dateRange changes
  useEffect(() => {
    setSchedule(null);
  }, [site, dateRange]);

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
    if (!site || !dateRange?.from) {
      return;
    }

    setIsGenerating(true);

    // Convert dates to simple YYYY-MM-DD strings to avoid timezone issues
    const formatDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const fromDateString = formatDateString(dateRange.from);
    const toDateString = formatDateString(dateRange.to ?? dateRange.from);

    // Call the backend procedure to generate the schedule
    generateScheduleMutation.mutate({
      site,
      dateRange: {
        fromDate: fromDateString,
        toDate: toDateString,
      },
    });
  };

  // Only require site and from date to be selected
  const isDisabled = !site || !dateRange?.from;

  return (
    <div className={styles.container}>
      {!schedule && (
        <ActionButton
          onClick={generateSchedule}
          disabled={isDisabled || isGenerating}
        >
          {isGenerating ? "Génération en cours..." : "Générer mon planning"}
        </ActionButton>
      )}
      {isDisabled && (
        <p className={styles.helperText}>
          Veuillez sélectionner un camping et une date pour générer votre
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

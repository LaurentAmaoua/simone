"use client";

import { Calendar as ShadCNCalendar } from "~/components/ui/calendar";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { skipToken } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { type CAMPSITES } from "./Select";
import { fr } from "date-fns/locale";
import { api } from "~/trpc/react";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

import styles from "./_styles/Calendar.module.css";

export type CalendarProps = {
  date: string | undefined;
  onSelect: (date: string | undefined) => void;
  site: CAMPSITES | undefined;
  disabled: boolean;
};

export const Calendar = ({
  date: dateFromProps,
  onSelect,
  disabled,
  site,
}: CalendarProps) => {
  const [hasSelected, setHasSelected] = useState(false);
  const [date, setDate] = useState<string | undefined>(dateFromProps);

  const { data: daysWithActivities } =
    api.activity.getDaysWithActivitiesForSite.useQuery(
      site ? { site } : skipToken,
      { enabled: !!site },
    );

  const handleSelect = (date: Date) => {
    setHasSelected(true);
    onSelect(format(date, "yyyy-MM-dd"));
    if (date?.getMonth() !== new Date().getMonth()) {
      setDate(format(date, "yyyy-MM-dd"));
    }
  };

  useEffect(() => {
    setDate(dateFromProps);
  }, [dateFromProps]);

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        asChild
        className={`${styles.popoverTrigger} ${hasSelected ? styles.selected : ""}`}
      >
        <Button variant="outline" className={styles.button}>
          <CalendarIcon className={styles.calendarIcon} />
          {date ? (
            format(date, "PPP", { locale: fr })
          ) : (
            <span>Choisir une date</span>
          )}
          <ChevronDown className={styles.chevronDown} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={styles.popoverContent}>
        <ShadCNCalendar
          className={styles.calendar}
          locale={fr}
          classNames={{
            root: styles.root,
            head_cell: styles.headCell,
            day_selected: styles.daySelected,
            cell: styles.cell,
            day: styles.day,
            day_today: styles.dayToday,
            day_outside: styles.dayOutside,
            month: styles.month,
          }}
          daysWithActivities={daysWithActivities}
          mode="single"
          selected={date ? new Date(date) : undefined}
          onSelect={(day) => day && handleSelect(day)}
          today={!date ? new Date() : undefined}
          showOutsideDays={false}
        />
      </PopoverContent>
    </Popover>
  );
};

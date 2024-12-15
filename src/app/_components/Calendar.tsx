"use client";

import { Calendar as ShadCNCalendar } from "~/components/ui/calendar";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { skipToken } from "@tanstack/react-query";
import { type DateRange } from "react-day-picker";
import { Button } from "~/components/ui/button";
import { useEffect, useState } from "react";
import { type CAMPSITES } from "./Select";
import { fr } from "date-fns/locale";
import { api } from "~/trpc/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";

import styles from "./_styles/Calendar.module.css";
import { formatToFrenchDate } from "~/lib/date";

export type CalendarProps = {
  date: DateRange | undefined;
  onSelect: (dateRange: DateRange | undefined) => void;
  site: CAMPSITES | undefined;
  disabled: boolean;
};

export const Calendar = ({
  date: dateFromProps,
  onSelect,
  disabled,
  site,
}: CalendarProps) => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    dateFromProps,
  );

  console.log("dateRange", dateRange);

  const { data: daysWithActivities } =
    api.activity.getDaysWithActivitiesForSite.useQuery(
      site ? { site } : skipToken,
      { enabled: !!site },
    );

  const handleSelect = (dateRange: DateRange | undefined) => {
    onSelect(dateRange);
    // if (date?.getMonth() !== new Date().getMonth()) {
    //   setDate(format(date, "yyyy-MM-dd"));
    // }
  };

  useEffect(() => {
    setDateRange(dateFromProps);
  }, [dateFromProps]);

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        asChild
        className={`${styles.popoverTrigger}`}
      >
        <Button variant="outline" className={styles.button}>
          <CalendarIcon className={styles.calendarIcon} />
          {dateRange?.from && dateRange.to ? (
            <span>
              {formatToFrenchDate(dateRange.from)} -{" "}
              {formatToFrenchDate(dateRange.to)}
            </span>
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
            cell: styles.cell,
            day: styles.day,
            day_today: styles.dayToday,
            day_outside: styles.dayOutside,
            month: styles.month,
            day_selected: styles.daySelected,
            day_range_start: styles.dayRangeStart,
            day_range_middle: styles.dayRangeMiddle,
            day_range_end: styles.dayRangeEnd,
          }}
          daysWithActivities={daysWithActivities}
          mode="range"
          selected={dateRange ? dateRange : undefined}
          onSelect={(range) => {
            handleSelect(range);
          }}
          today={new Date()}
          showOutsideDays={false}
        />
      </PopoverContent>
    </Popover>
  );
};

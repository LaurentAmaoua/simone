"use client";

import { Button, DayPicker, useDayRender } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "~/components/ui/button";
import { type ComponentProps, useRef } from "react";
import { format } from "date-fns";
import { cn } from "~/lib/utils";

import styles from "./styles/calendar.module.css";

export type CalendarProps = ComponentProps<typeof DayPicker> & {
  daysWithActivities: Date[] | undefined;
};

interface CustomDayProps {
  className: string;
  date: Date;
  displayMonth: Date;
}

const CustomDay = ({ date, displayMonth, className }: CustomDayProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  // @ts-expect-error - Circular clusterf*ck
  const dayRender = useDayRender(date, displayMonth, buttonRef);

  if (dayRender.isHidden) {
    return <div role="gridcell"></div>;
  }
  if (!dayRender.isButton) {
    return <div {...dayRender.divProps} />;
  }
  return (
    <Button
      {...dayRender.buttonProps}
      className={className}
      name="day"
      ref={buttonRef}
    />
  );
};

function Calendar({
  className,
  classNames,
  daysWithActivities,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const isToday = props.today?.toDateString();
  const selected =
    props.selected instanceof Date
      ? format(props.selected, "yyyy-MM-dd")
      : undefined;
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Day: ({ ...props }) => {
          const blah = props.date.toDateString();
          const hasActivity = daysWithActivities?.some((day) => {
            const blee = day.toDateString();
            return blee === blah;
          });
          return (
            <CustomDay
              date={props.date}
              displayMonth={props.displayMonth}
              className={` ${hasActivity ? styles.hasActivity : ""} ${classNames?.day} ${selected === format(props.date, "yyyy-MM-dd") ? classNames?.day_selected : ""} ${isToday === props.date.toDateString() ? classNames?.day_today : ""}`}
            />
          );
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

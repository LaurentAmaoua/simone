export const formatToFrenchDate = (
  date: Date,
  withYear = true,
  withWeekday = false,
) => {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: withYear ? "2-digit" : undefined,
    weekday: withWeekday ? "long" : undefined,
  };

  const formattedDate = Intl.DateTimeFormat("fr-FR", options).format(date);

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

export const formatToShortWeekday = (date: Date) => {
  return Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(date);
};

export const formatTime = (date: Date) => {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
};

export const formatActivityDuration = (duration: string | null | undefined) => {
  if (!duration) return "";

  // Format already looks good for display
  return duration;
};

export const sortByChronologicalOrder = (a: Date, b: Date) => {
  return a.getTime() - b.getTime();
};

// Get the abbreviated days of the week in French, starting with Monday
export const getFrenchWeekdayShortNames = (): string[] => {
  const weekdays = [];
  // Start with Monday (1) and go through Sunday (0)
  for (let i = 1; i <= 7; i++) {
    const day = new Date(2023, 0, i); // January 2023, where the 1st is a Sunday
    weekdays.push(
      Intl.DateTimeFormat("fr-FR", { weekday: "short" })
        .format(day)
        .slice(0, 3),
    );
  }
  return weekdays;
};

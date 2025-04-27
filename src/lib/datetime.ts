export const formatToFrenchDate = (date: Date) => {
  const formattedDate = Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(date);

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
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

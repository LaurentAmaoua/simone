export const formatToFrenchDate = (date: Date) => {
  const formattedDate = Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};
const getTime = (date: Date) => {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
};
export const getTimes = (startDate: Date, endDate: Date) => {
  return `${getTime(startDate)} - ${getTime(endDate)}`;
};
export const sortByChronologicalOrder = (a: Date, b: Date) => {
  return a.getTime() - b.getTime();
};

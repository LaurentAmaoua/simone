export const formatToFrenchDate = (date: Date) => {
  const formattedDate = Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

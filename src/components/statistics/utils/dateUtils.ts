
import { subDays, differenceInDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { getWeek, format as dateFnsFormat } from "date-fns";
import { nb } from "date-fns/locale";
import { TimeRange, DateRange } from "../types";

export const updateDateRange = (range: TimeRange): DateRange => {
  const now = new Date();
  let from = now;

  switch (range) {
    case '7d':
      from = subDays(now, 7);
      break;
    case '30d':
      from = subDays(now, 30);
      break;
    case '90d':
      from = subDays(now, 90);
      break;
    case '365d':
      from = subDays(now, 365);
      break;
    case 'all':
      from = subDays(now, 365); // Default to 1 year if no conversations exist
      break;
    case 'custom':
      return { from: now, to: now }; // Return dummy range that will be overridden
  }

  return { from, to: now };
};

export const getTimeFrames = (from: Date, to: Date) => {
  const daysDifference = differenceInDays(to, from);
  const timeFrames: { start: Date; end: Date }[] = [];
  let currentDate = new Date(from);

  if (daysDifference <= 30) {
    while (currentDate <= to) {
      timeFrames.push({
        start: new Date(currentDate),
        end: new Date(currentDate)
      });
      currentDate = addDays(currentDate, 1);
    }
  } else if (daysDifference < 365) {
    while (currentDate <= to) {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 }); // Sunday
      
      timeFrames.push({
        start: weekStart,
        end: weekEnd > to ? new Date(to) : weekEnd
      });
      
      currentDate = addDays(weekEnd, 1);
    }
  } else {
    while (currentDate <= to) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      timeFrames.push({
        start: monthStart,
        end: monthEnd > to ? new Date(to) : monthEnd
      });
      
      currentDate = addDays(monthEnd, 1);
    }
  }

  return timeFrames;
};

export const formatDateLabel = (date: Date, daysDiff: number) => {
  if (daysDiff <= 30) {
    return dateFnsFormat(date, 'dd.MM');
  } else if (daysDiff < 365) {
    return `Uke ${getWeek(date, { locale: nb })}`;
  } else {
    return dateFnsFormat(date, 'LLLL', { locale: nb });
  }
};

export const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.floor(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes} minutter`;
  } else if (remainingMinutes === 0) {
    return `${hours} timer`;
  } else {
    return `${hours} timer og ${remainingMinutes} minutter`;
  }
};

export const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  }).format(amount);
};

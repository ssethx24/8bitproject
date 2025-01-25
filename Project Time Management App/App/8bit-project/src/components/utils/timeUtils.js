// src/utils/dateUtils.js

import { addDays, addHours, addMinutes, parseISO, format } from 'date-fns';

/**
 * Parses a time string (e.g., "2w 6d 4h 25m") into weeks, days, hours, and minutes.
 * @param {string} timeStr - The time string to parse.
 * @returns {Object} - An object with weeks, days, hours, and minutes.
 */
export const parseTimeString = (timeStr) => {
  const regex = /(?:(\d+)w)?\s*(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?/;
  const matches = timeStr.match(regex);

  return {
    weeks: parseInt(matches[1], 10) || 0,
    days: parseInt(matches[2], 10) || 0,
    hours: parseInt(matches[3], 10) || 0,
    minutes: parseInt(matches[4], 10) || 0,
  };
};

/**
 * Calculates the completion date based on start date and actual time spent.
 * @param {string} startDateStr - The start date in 'yyyy-MM-dd' format.
 * @param {string} actualTimeStr - The actual time spent (e.g., "1d 6h 45m").
 * @returns {string} - The completion date in 'yyyy-MM-dd' format.
 */
export const calculateCompletionDate = (startDateStr, actualTimeStr) => {
  const startDate = parseISO(startDateStr);
  const { weeks, days, hours, minutes } = parseTimeString(actualTimeStr);

  let completionDate = addDays(startDate, weeks * 7 + days);
  completionDate = addHours(completionDate, hours);
  completionDate = addMinutes(completionDate, minutes);

  // If the time addition crosses to the next day, adjust the date
  return format(completionDate, 'yyyy-MM-dd');
};

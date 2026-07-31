/**
 * Convert 24h "HH:mm" (or "HH:mm:ss") to 12-hour display, e.g. "09:00" -> "9:00 AM".
 */
export const formatTime12Hour = (value) => {
  if (value == null || value === "") return "";
  const raw = String(value).trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return raw;

  let hours = Number(match[1]);
  const minutes = match[2];
  if (!Number.isFinite(hours) || hours < 0 || hours > 23) return raw;

  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  if (hours === 0) hours = 12;

  return `${hours}:${minutes} ${suffix}`;
};

/**
 * Format a daily class duration range in 12-hour time.
 * Example: "09:00", "13:00" -> "9:00 AM – 1:00 PM"
 */
export const formatClassTimeRange = (startTime, endTime) => {
  const start = formatTime12Hour(startTime);
  const end = formatTime12Hour(endTime);
  if (start && end) return `${start} – ${end}`;
  return start || end || "";
};

/** Hour (0–23) in a place given Open-Weather-Map `timezone` (seconds offset from UTC). */
export function hourAtLocation(utcMs: number, timezoneOffsetSec: number): number {
  const sec = Math.floor(utcMs / 1000) + timezoneOffsetSec;
  const secIntoDay = ((sec % 86400) + 86400) % 86400;
  return Math.floor(secIntoDay / 3600);
}

export function greetingFromHour(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  if (hour >= 17 && hour < 22) return "Good evening";
  return "Good night";
}

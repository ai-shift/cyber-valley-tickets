import { formatTimestamp } from "@/shared/lib/formatTimestamp";

export function getTimeAgoString(timestamp: number): string {
  const now = Date.now() / 1000;
  const diffInSeconds = Math.floor(now - timestamp);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInSeconds < 3600)
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  const diffInHours = Math.floor(diffInSeconds / 3600);
  if (diffInSeconds < 86400)
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  const diffInDays = Math.floor(diffInSeconds / 86400);
  if (diffInSeconds < 2592000)
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;

  return formatTimestamp(timestamp);
}

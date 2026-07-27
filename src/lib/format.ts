const CLOCK_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const DAY_FORMATTER = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
});

export function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? '' : CLOCK_FORMATTER.format(date);
}

export function formatRelativeTime(
  timestamp: string,
  referenceTime = Date.now(),
): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const elapsedMs = Math.max(0, referenceTime - date.getTime());
  const elapsedMinutes = Math.floor(elapsedMs / 60_000);

  if (elapsedMinutes < 1) {
    return 'now';
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}m`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}h`;
  }

  const elapsedDays = Math.floor(elapsedHours / 24);
  if (elapsedDays < 7) {
    return `${elapsedDays}d`;
  }

  return DAY_FORMATTER.format(date);
}

export function formatCallDuration(totalSeconds: number): string {
  const normalizedSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(normalizedSeconds / 60);
  const seconds = normalizedSeconds % 60;
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return [hours, minutes % 60, seconds]
      .map((part) => String(part).padStart(2, '0'))
      .join(':');
  }

  return [minutes, seconds]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function truncateColorString(kmlColor: string): string {
  if (!kmlColor || kmlColor.length !== 8) {
    throw new Error("Invalid KML color format (expected 8 hex chars).");
  }

  const b = kmlColor.substring(2, 4);
  const g = kmlColor.substring(4, 6);
  const r = kmlColor.substring(6, 8);

  return `#${r}${g}${b}`.toLowerCase();
}

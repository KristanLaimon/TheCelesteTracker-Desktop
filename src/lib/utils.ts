export function formatChapterName(name: string, sid: string): string {
  // If name exists and isn't just a placeholder, use it
  if (name && !name.includes("{") && !name.includes("}")) {
    return name;
  }

  // Clean up SID: "Celeste/1-ForsakenCity" -> "Forsaken City"
  // "Celeste/2-OldSite" -> "Old Site"
  const parts = sid.split("/");
  let clean = parts[parts.length - 1];

  // Remove numbers at start like "1-" or "1_"
  clean = clean.replace(/^\d+[-_]/, "");

  // Convert PascalCase/camelCase to Spaced Case
  clean = clean.replace(/([A-Z])/g, " $1").trim();

  // Replace underscores/hyphens with spaces
  clean = clean.replace(/[-_]/g, " ");

  return clean;
}

export function formatTime(ticks: number): string {
  const ms = Math.floor((ticks / 10000) % 1000);
  const totalSeconds = Math.floor(ticks / 10000000);
  const s = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const m = totalMinutes % 60;
  const h = Math.floor(totalMinutes / 60);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const padMs = (n: number) => n.toString().padStart(3, "0");

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}.${padMs(ms)}`;
  }
  return `${pad(m)}:${pad(s)}.${padMs(ms)}`;
}

// Pilot rules, locked 2026-11-21. The database (app_settings) is the source of truth; these are for display.
export const PRICE_MNT = 25000;
export const OPERATOR_SHARE = 0.8;
export const ACCEPT_MIN = 5;
export const SEARCH_MIN = 10;
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 23;
export const UTC_OFFSET = 9; // Korea, no daylight saving

export const mnt = (n: number) => `₮${n.toLocaleString("en-US")}`;

export function localHour(now = new Date()) {
  return (now.getUTCHours() + UTC_OFFSET) % 24;
}

export function isOpen(now = new Date()) {
  const h = localHour(now);
  return h >= OPEN_HOUR && h < CLOSE_HOUR;
}

const EMERGENCY = [
  "emergency", "ambulance", "police", "bleeding", "chest pain", "unconscious", "fire", "attack", "suicide", "overdose", "can't breathe",
  "яаралтай", "түргэн тусламж", "цагдаа", "гал", "цус", "ухаан алдсан", "амьсгал", "зодсон",
  "응급", "구급차", "경찰", "화재", "피가", "의식", "숨을",
];

export function looksLikeEmergency(text: string) {
  const t = text.toLowerCase();
  return EMERGENCY.some((w) => t.includes(w));
}

export const EMERGENCY_NUMBERS = [
  { n: "112", k: "police" },
  { n: "119", k: "ambulance" },
  { n: "1330", k: "travel" },
] as const;

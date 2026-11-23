// Mirrors shared/aylix-tokens.css (light theme) from the aylix.io repo.
export const c = {
  blue: "#1369AC",
  blueHover: "#0F538A",
  blueTint: "#E7F0F7",
  navy: "#224477",
  navyTint: "#E9ECF1",
  green: "#1F7A5A",
  greenTint: "rgba(31,122,90,0.10)", // Trust Green with opacity, not mint
  gold: "#C98200",
  goldTint: "#FAF3E6",
  goldText: "#8F5D00",
  red: "#D94A4A",
  redText: "#B83F3F",
  redTint: "#FBEDED",
  page: "#F9F9F9",
  surface: "#FFFFFF",
  neutralTint: "#F2F3F3",
  disabled: "#EEEFEF",
  text: "#171717",
  text2: "#5D5D5D",
  text3: "#8B8B8B",
  onColor: "#FFFFFF",
  border: "#C1C4C3",
  hairline: "#ECEDED",
};

export const r = { sm: 8, md: 12, lg: 16, pill: 999 };
export const s = (n: number) => n * 4;

export const type = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: "700" as const },
  h1: { fontSize: 24, lineHeight: 32, fontWeight: "600" as const },
  h2: { fontSize: 20, lineHeight: 28, fontWeight: "600" as const },
  title: { fontSize: 18, lineHeight: 28, fontWeight: "600" as const },
  body: { fontSize: 16, lineHeight: 24 },
  bodySm: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "600" as const, letterSpacing: 0.6, textTransform: "uppercase" as const },
};

export const shadow = {
  shadowColor: "#224477",
  shadowOpacity: 0.05,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 1,
};

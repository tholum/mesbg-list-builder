export const allianceColours = {
  Historical: "success",
  Convenient: "warning",
  Impossible: "danger",
  "Legendary Legion": "info",
  "n/a": "secondary",
};

export type AllianceLevel = keyof typeof allianceColours;

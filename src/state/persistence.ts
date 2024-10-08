import { AppState } from "./store.ts";

type StoreKey = keyof AppState;
export const keysToPersist: StoreKey[] = [
  "roster",
  "gameMode",
  "gameState",
  "factions",
  "factionType",
  "factionMetaData",
  "allianceLevel",
  "uniqueModels",
  "rosterBuildingWarnings",
  "armyBonusActive",
];

export const getStateToPersist = (state: AppState): Partial<AppState> =>
  Object.fromEntries(
    Object.entries(state).filter((stateEntry) =>
      keysToPersist.includes(stateEntry[0] as StoreKey),
    ),
  );

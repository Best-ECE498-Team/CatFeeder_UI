export const placeholderFeederStatus = {
  controlBoardConnected: false,
  heatingTemperature: null,
  coolingBowl1Temperature: null,
  coolingBowl2Temperature: null,
  trayPosition: null,
  batteryLevel: null,
  heaterState: "unavailable",
  coolerState: "unavailable",
  doorPosition: "unavailable",
  bowlLiftState: "unavailable",
} as const;

export type PlaceholderFeederStatus = typeof placeholderFeederStatus;

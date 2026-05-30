export const CONFIG = {
  tower: {
    rows: 8,
    baseMulti: 1.35
  },
  mines: {
    gridSize: 25,
    plusMultiPerBomb: 0.05
  },
  gacha: {
    minPerBox: 250,
    maxBoxes: 4,
    totalSlots: 5
  },
  crash: {
    tickInterval: 100,   // ms per tick
    maxRandom: 20        // tidak dipakai langsung, crash point dari generateCrashPoint()
  },
  chicken: {
    totalLanes: 10,
    multiPerLane: 0.25
  }
};

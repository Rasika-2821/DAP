const MATRIX = [
  ['F', 'C', '9', '8'],
  ['J', '3', '2', '7'],
  ['K', '4', '5', '6'],
  ['L', 'M', 'P', 'T']
];

export const calculateDigipin = (lat: number, lon: number): string => {
  let minLat = 2.5, maxLat = 38.5;
  let minLon = 63.5, maxLon = 99.5;
  let digipin = "";

  // 1. Validation
  if (lat < minLat || lat > maxLat || lon < minLon || lon > maxLon) {
    return "OUT-OF-BOUNDS";
  }

  // 2. Loop for 10 Levels of precision
  for (let level = 0; level < 10; level++) {
    const latStep = (maxLat - minLat) / 4;
    const lonStep = (maxLon - minLon) / 4;

    let foundRow = -1;
    let nextMinLat = minLat, nextMaxLat = maxLat;

    // Find Row
    for (let r = 0; r < 4; r++) {
      const cellMaxLat = maxLat - (r * latStep);
      const cellMinLat = maxLat - ((r + 1) * latStep);
      // Note: Logic aligns with Python's top-down row scan
      if (lat <= cellMaxLat && lat >= cellMinLat) {
        foundRow = r;
        nextMaxLat = cellMaxLat;
        nextMinLat = cellMinLat;
        break;
      }
    }

    let foundCol = -1;
    let nextMinLon = minLon, nextMaxLon = maxLon;

    // Find Column
    for (let c = 0; c < 4; c++) {
      const cellMinLon = minLon + (c * lonStep);
      const cellMaxLon = minLon + ((c + 1) * lonStep);

      if (lon >= cellMinLon && lon <= cellMaxLon) {
        foundCol = c;
        nextMinLon = cellMinLon;
        nextMaxLon = cellMaxLon;
        break;
      }
    }

    if (foundRow === -1 || foundCol === -1) return "ERROR";

    // Append Character
    digipin += MATRIX[foundRow][foundCol];

    // 3. Update bounds for next iteration
    minLat = nextMinLat;
    maxLat = nextMaxLat;
    minLon = nextMinLon;
    maxLon = nextMaxLon;
  }

  // 4. Format with hyphens (Example: 8Q2-FJJ-2P8T)
  return digipin.slice(0, 3) + "-" + digipin.slice(3, 6) + "-" + digipin.slice(6);
};

export const validateDigipin = (digipin: string): boolean => {
  const cleaned = digipin.replace(/-/g, '');
  if (cleaned.length !== 10) return false;
  const validChars = new Set(['F', 'C', '9', '8', 'J', '3', '2', '7', 'K', '4', '5', '6', 'L', 'M', 'P', 'T']);
  return [...cleaned].every(char => validChars.has(char));
};

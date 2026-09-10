// Utility to extract latitude and longitude from a string
export function extractLatLng(coordString?: string): { lat: number; lng: number } | null {
  if (!coordString) return null;
  // Try to match decimal degrees: e.g. 28.6139, 77.2090
  const match = coordString.match(/(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/);
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
  }

  // Try to match coordinates with degree symbol and N/S/E/W, e.g. 11.2342° N, 78.8807° E
  // Supports: 11.2342° N, 78.8807° E or 11.2342 N, 78.8807 E

  const regex = /([\d.]+)\s*°?\s*([NS]),?\s*[,;]?\s*([\d.]+)\s*°?\s*([EW])/i;
  const matchDir = regex.exec(coordString);
  if (matchDir) {
    let lat = parseFloat(matchDir[1]);
    let lng = parseFloat(matchDir[3]);
    if (matchDir[2].toUpperCase() === 'S') lat = -lat;
    if (matchDir[4].toUpperCase() === 'W') lng = -lng;
    return { lat, lng };
  }

  // Try to match coordinates with direction after the number, e.g. N 11.2342, E 78.8807
  const regex2 = /([NS])\s*([\d.]+)[,\s]+([EW])\s*([\d.]+)/i;
  const matchDir2 = regex2.exec(coordString);
  if (matchDir2) {
    let lat = parseFloat(matchDir2[2]);
    let lng = parseFloat(matchDir2[4]);
    if (matchDir2[1].toUpperCase() === 'S') lat = -lat;
    if (matchDir2[3].toUpperCase() === 'W') lng = -lng;
    return { lat, lng };
  }

  return null;
}

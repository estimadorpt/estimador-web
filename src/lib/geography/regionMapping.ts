/**
 * Central mapping utility for Portuguese geographic regions
 */

/**
 * Maps island names to their corresponding aggregated regions (Açores/Madeira)
 * or returns the original name for continental districts
 */
export function getRegionForIsland(islandName: string): string {
  const azoresIslands = [
    "Ilha do Faial", 
    "Ilha de São Jorge", 
    "Ilha da Graciosa", 
    "Ilha Terceira", 
    "Ilha das Flores", 
    "Ilha do Corvo", 
    "Ilha de São Miguel", 
    "Ilha de Santa Maria", 
    "Ilha do Pico"
  ];
  
  const madeiraIslands = [
    "Ilha da Madeira", 
    "Ilha de Porto Santo"
  ];

  if (azoresIslands.includes(islandName)) return "Açores";
  if (madeiraIslands.includes(islandName)) return "Madeira";
  return islandName; // If not an island, return the name itself (continental district)
}
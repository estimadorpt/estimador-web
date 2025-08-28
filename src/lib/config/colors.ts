import { ContestantData } from '@/types';

// Parliamentary parties configuration
export const partyColors = {
  "AD": "#FF8C00",  // Dark Orange
  "PS": "#E57373",  // Muted Pink
  "CH": "#377EB8",  // Blue
  "IL": "#A6CEE3",  // Light Blue 
  "BE": "#000000",  // Black
  "CDU": "#E41A1C", // Red
  "L":  "#90EE90",  // Light Green
  "PAN": "#4CAF50", // Green for PAN
  "OTH": "#A65628"  // Brown
};

export const partyOrder = ["AD", "PS", "CH", "IL", "BE", "CDU", "L", "PAN", "OTH"];

export const partyNames = {
  "AD": "Aliança Democrática",
  "PS": "Partido Socialista", 
  "CH": "Chega",
  "IL": "Iniciativa Liberal",
  "BE": "Bloco de Esquerda",
  "CDU": "CDU",
  "L": "Livre",
  "PAN": "PAN",
  "OTH": "Others"
};

// Presidential candidates color palette (gender-neutral professional colors)
export const presidentialColors = {
  "incumbent": "#2E7D32",     // Forest Green
  "center-right": "#FF8C00",  // Orange  
  "center-left": "#E57373",   // Muted Pink
  "right": "#377EB8",         // Blue
  "left": "#E41A1C",          // Red
  "independent": "#9C27B0",   // Purple
  "green": "#4CAF50",         // Green
  "liberal": "#A6CEE3",       // Light Blue
  "other": "#A65628"          // Brown
};

// Municipal party colors (extends parliamentary colors)
export const municipalColors = {
  ...partyColors,
  "PSD": "#FF8C00",  // Orange (for when PSD runs separately from AD)
  "CDS": "#4169E1",  // Royal Blue
  "IND": "#808080",  // Gray for independents
  "MOV": "#9C27B0"   // Purple for local movements
};

// European party group colors
export const europeanGroupColors = {
  "EPP": "#3399FF",     // European People's Party - Blue
  "S&D": "#F0001C",     // Socialists & Democrats - Red  
  "Renew": "#FFCC00",   // Renew Europe - Yellow
  "Greens": "#00A651",  // Greens/EFA - Green
  "ECR": "#54A0DC",     // European Conservatives - Light Blue
  "ID": "#F4A460",      // Identity & Democracy - Sandy Brown
  "Left": "#CC0000",    // The Left - Dark Red
  "NI": "#808080"       // Non-Inscrits - Gray
};

// Convert parties to ContestantData format for parliamentary elections
export function getParliamentaryContestants(): ContestantData[] {
  return partyOrder.map(partyId => ({
    id: partyId,
    name: partyNames[partyId as keyof typeof partyNames],
    shortName: partyId,
    type: 'party' as const,
    color: partyColors[partyId as keyof typeof partyColors],
    isIncumbent: false // Can be updated based on election context
  }));
}

// Get color by contestant ID and election type
export function getContestantColor(contestantId: string, electionType: string): string {
  switch (electionType) {
    case 'parliamentary':
      return partyColors[contestantId as keyof typeof partyColors] || '#808080';
    case 'presidential':
      return presidentialColors[contestantId as keyof typeof presidentialColors] || '#808080';
    case 'municipal':
      return municipalColors[contestantId as keyof typeof municipalColors] || '#808080';
    case 'european':
      return europeanGroupColors[contestantId as keyof typeof europeanGroupColors] || '#808080';
    default:
      return '#808080';
  }
}

// Check if a contestant should be included in visualizations
export function isValidContestant(contestantId: string, electionType: string): boolean {
  switch (electionType) {
    case 'parliamentary':
      return partyColors.hasOwnProperty(contestantId);
    case 'presidential':
      return presidentialColors.hasOwnProperty(contestantId);
    case 'municipal':
      return municipalColors.hasOwnProperty(contestantId);
    case 'european':
      return europeanGroupColors.hasOwnProperty(contestantId);
    default:
      return false;
  }
}
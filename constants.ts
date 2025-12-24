export const MEASUREMENT_TYPES = [
  { label: 'Peso (kg)', key: 'Peso', icon: 'fa-weight-scale', step: 0.1 },
  { label: 'Petto (cm)', key: 'Petto', icon: 'fa-ruler-horizontal', step: 0.1 },
  { label: 'Vita (cm)', key: 'Vita', icon: 'fa-ruler', step: 0.1 },
  { label: 'Fianchi (cm)', key: 'Fianchi', icon: 'fa-ruler-combined', step: 0.1 },
  { label: 'Coscia (cm)', key: 'Coscia', icon: 'fa-ruler-vertical', step: 0.1 },
  { label: 'Bicipite SX (cm)', key: 'Bicipite SX', icon: 'fa-dumbbell', step: 0.1 },
  { label: 'Bicipite DX (cm)', key: 'Bicipite DX', icon: 'fa-dumbbell', step: 0.1 },
  { label: 'Polpaccio (cm)', key: 'Polpaccio', icon: 'fa-shoe-prints', step: 0.1 },
  { label: 'Collo (cm)', key: 'Collo', icon: 'fa-user-tie', step: 0.1 },
];

export const COLOR_MAP: Record<string, string> = {
  'Peso': '#000000',      // Black
  'Petto': '#0891b2',     // Cyan
  'Vita': '#e11d48',      // Rose
  'Fianchi': '#d97706',   // Amber
  'Coscia': '#16a34a',    // Green
  'Bicipite SX': '#8b5cf6', // Violet
  'Bicipite DX': '#7c3aed', // Darker Violet
  'Polpaccio': '#ea580c', // Orange
  'Collo': '#475569',     // Slate
};

export const getRandomColor = () => {
  const hex = Math.floor(Math.random() * 16777215).toString(16);
  return '#' + hex.padStart(6, '0');
};
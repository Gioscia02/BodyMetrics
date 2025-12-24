export interface Measurement {
  id: string;
  name: string;
  value: number;
  timestamp: string; // YYYY-MM-DD
}

export interface MeasurementInput {
  name: string;
  value: string;
}

export interface UserProfile {
  avatarBase64?: string;
  height?: number; // in cm
  gender?: 'male' | 'female';
  birthDate?: string; // YYYY-MM-DD
}

export interface GroupedMeasurement {
  date: string;
  items: Measurement[];
}

export type StatusType = 'idle' | 'loading' | 'connected' | 'error';

export interface StatusMessage {
  type: StatusType;
  text: string;
}
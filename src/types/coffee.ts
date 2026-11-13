/** Coffee bean domain types. */

export type ProcessMethod =
  | 'Washed'
  | 'Natural'
  | 'Honey'
  | 'Anaerobic'
  | 'Carbonic Maceration'
  | 'Infused';

export type RoastLevel = 'Light' | 'Medium-Light' | 'Medium' | 'Medium-Dark' | 'Dark';

export interface CoffeeBean {
  id: string;
  name: string;
  origin: string | null;
  country: string | null;
  region: string | null;
  farm: string | null;
  variety: string | null;
  process: ProcessMethod;
  roastLevel: RoastLevel;
  /** ISO date (yyyy-mm-dd) or null when unknown. */
  roastDate: string | null;
  tastingNotes: string | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CoffeeBeanDraft {
  name: string;
  origin: string;
  country: string;
  region: string;
  farm: string;
  variety: string;
  process: ProcessMethod;
  roastLevel: RoastLevel;
  roastDate: string | null;
  tastingNotes: string;
  notes: string;
}

export interface CoffeeBeanWithStats extends CoffeeBean {
  sessionCount: number;
  lastBrewedAt: string | null;
  averageRating: number | null;
}

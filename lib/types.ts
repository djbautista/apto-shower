export interface Attendee {
  id: number;
  name: string;
  pin: string;
  gift_description: string | null;
  budget: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface GiftSuggestion {
  regalo: string;
  precioEstimado: number;
  descripcion: string;
}

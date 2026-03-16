export interface Attendee {
  id: number;
  name: string;
  pin: string;
  gift_description: string | null;
  budget: number | null;
  failed_login_attempts: number;
  locked: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GiftSuggestion {
  regalo: string;
  precioEstimado: number;
  descripcion: string;
}

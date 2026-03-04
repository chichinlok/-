export interface Session {
  id: string;
  host_name: string;
  host_whatsapp?: string;
  game_name: string;
  player_count_preference: string;
  dates_available: string[];
  game_source: string;
  min_players: number;
  max_players: number;
  created_at: string;
  max_available_count?: number;
  best_date?: string;
}

export interface Response {
  id: string;
  session_id: string;
  player_name: string;
  dates_available: string[];
  created_at: string;
}

export interface SessionWithResponses extends Session {
  responses: Response[];
}

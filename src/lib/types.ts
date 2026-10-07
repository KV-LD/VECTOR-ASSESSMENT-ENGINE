export type RoleKey = 'eng' | 'con' | 'fin' | 'hr' | 'del';
export type DimKey = 'V' | 'E' | 'C' | 'T' | 'O' | 'R';
export type QuestionType = 'sit' | 'beh';
export type VectorClass = 'V1' | 'V2' | 'V3' | 'V4' | 'V5';

export interface QuestionOption {
  l: string; // label (A, B, C, D, E)
  t: string; // text
  s: number; // score
}

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  dim: DimKey;
  opts: QuestionOption[];
}

export interface OtpRecord {
  email: string;
  code: string;
  created_at: string;
  expires_at: string;
  attempts: number;
  consumed: boolean;
}

export interface AttemptRecord {
  id: string;
  email: string;
  role: RoleKey;
  attempted_at: string;
  level_V: number;
  level_E: number;
  level_C: number;
  level_T: number;
  level_O: number;
  level_R: number;
  class: VectorClass;
  dominant: DimKey;
  signature: string;
  floor_check_applied: boolean;
  next_move_dimension: DimKey;
  next_move_technique: string;
  answers_json: string;
}

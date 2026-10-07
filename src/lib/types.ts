export type RoleKey = 'eng' | 'con' | 'fin' | 'hr' | 'del';
export type DimKey = 'V' | 'E' | 'C' | 'T' | 'O' | 'R';
export type QuestionType = 'sit' | 'beh';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  dim: DimKey;
  opts: Array<{ l: string; t: string; s: number }>;
}

export interface AttemptRecord {
  email: string;
  role: RoleKey;
  attempted_at: string;
  answers_json: string;
}

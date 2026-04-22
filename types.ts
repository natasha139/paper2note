
export interface PaperNoteData {
  catchyTitle: string;
  paperTitle: string;
  authors: string;
  source: string;
  oneSentenceValue: string;
  researchQuestion: string;
  keyContribution: string;
  methods: string[];
  strengths: string[];
  limitations: string[];
  takeaways: string[];
  connection: string;
  questions: string;
  tags: string[];
  username: string;
}

export type ThemeType = 'cream' | 'white' | 'minimal' | 'modern' | 'dark' | 'ocean';

export interface ThemeConfig {
  bg: string;
  cardBg: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  iconColor: string;
}

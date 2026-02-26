export interface Task {
  id: string;
  title: string;
  content?: string;
  is_completed: boolean;
  is_important: boolean;
  due_date?: string;
  start_date?: string;
  remind_time?: string;
  repeat_rule?: string;
  list_id: string;
  created_at: string;
  updated_at: string;
}

export interface Subtask {
  id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface List {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  is_default: boolean;
  created_at: string;
  order: number;
}

export interface CreateTaskInput {
  title: string;
  content?: string;
  list_id: string;
  due_date?: string;
  start_date?: string;
  remind_time?: string;
  repeat_rule?: string;
}

export interface UpdateTaskInput {
  id: string;
  title?: string;
  content?: string;
  is_completed?: boolean;
  is_important?: boolean;
  due_date?: string;
  start_date?: string;
  remind_time?: string;
  repeat_rule?: string;
  list_id?: string;
}

export interface CreateListInput {
  name: string;
  color?: string;
  icon?: string;
}

export interface UpdateListInput {
  id: string;
  name?: string;
  color?: string;
  icon?: string;
  order?: number;
}

export interface CreateSubtaskInput {
  task_id: string;
  title: string;
}

export interface UpdateSubtaskInput {
  id: string;
  title?: string;
  is_completed?: boolean;
}

export type FilterType = 'all' | 'today' | 'planned' | 'important' | 'completed';

export interface RepeatRule {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  days?: string[];        // For weekly: ["Mon", "Tue", "Wed", etc.]
  daysOfMonth?: number[]; // For monthly: [1, 15, 30]
  monthDays?: number[];    // For yearly: [1, 15]
}

export type Language = 'zh-CN' | 'en-US';

export type Theme = 'light' | 'dark' | 'system';

export interface AppSettings {
  language: Language;
  theme: Theme;
}

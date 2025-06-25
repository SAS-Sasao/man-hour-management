export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'member';
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed' | 'on-hold';
  managerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  description: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  phaseId: string;
  projectId: string;
  name: string;
  description: string;
  estimatedHours: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  phaseId: string;
  taskId: string;
  date: Date;
  hours: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MonthlyReport {
  userId: string;
  projectId: string;
  year: number;
  month: number;
  totalHours: number;
  phaseBreakdown: {
    phaseId: string;
    phaseName: string;
    hours: number;
    taskBreakdown: {
      taskId: string;
      taskName: string;
      hours: number;
    }[];
  }[];
}
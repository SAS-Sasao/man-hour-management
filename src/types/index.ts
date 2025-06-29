export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  
  // 組織情報
  companyId?: string;
  divisionId?: string;
  departmentId?: string;
  groupId?: string;
  
  // 組織オブジェクト（JOIN時）
  company?: Company;
  division?: Division;
  department?: Department;
  group?: Group;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Division {
  id: string;
  companyId: string;
  code: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  company?: Company;
}

export interface Department {
  id: string;
  divisionId: string;
  code: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  division?: Division;
}

export interface Group {
  id: string;
  departmentId: string;
  code: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  department?: Department;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD';
  managerId?: string; // 後方互換性のため残す
  createdAt: Date;
  updatedAt: Date;
  managers?: ProjectManager[];
  members?: ProjectMember[];
  phases?: Phase[];
  tasks?: Task[];
  timeEntries?: TimeEntry[];
}

export interface ProjectManager {
  id: string;
  projectId: string;
  userId: string;
  role?: string; // "PRIMARY", "SECONDARY" など
  createdAt: Date;
  user?: User;
  project?: Project;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role?: string; // "DEVELOPER", "TESTER", "ANALYST" など
  joinDate: Date;
  leaveDate?: Date;
  createdAt: Date;
  user?: User;
  project?: Project;
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

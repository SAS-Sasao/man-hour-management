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
  
  // 🆕 WBS用新規フィールド
  plannedStartDate?: Date;    // 予定開始日
  plannedEndDate?: Date;      // 予定終了日
  actualStartDate?: Date;     // 実際の開始日
  actualEndDate?: Date;       // 実際の終了日
  status: TaskStatus;         // 作業状況
  assigneeId?: string;        // 担当者ID
  
  // リレーション
  assignee?: User;            // 担当者
  phase?: Phase;              // フェーズ
  project?: Project;          // プロジェクト
  timeEntries?: TimeEntry[];  // 工数入力
}

// 🆕 TaskStatus型定義
export type TaskStatus = 
  | 'NOT_STARTED'      // 未対応
  | 'IN_PROGRESS'      // 対応中
  | 'REVIEW_PENDING'   // レビュー待ち
  | 'REVIEWED'         // レビュー済
  | 'COMPLETED';       // 完了

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

// 🆕 WBS関連の型定義
export interface WBSProgressReport {
  projectId: string;
  projectName: string;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  notStartedTasks: number;
  overdueTasks: number;
  progressPercentage: number;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
}

export interface AssigneeWorkloadReport {
  assigneeId: string;
  assigneeName: string;
  activeTasks: number;
  completedTasks: number;
  overdueTasksCount: number;
  estimatedHours: number;
  actualHours: number;
  efficiency: number;
  currentWorkload: 'LOW' | 'NORMAL' | 'HIGH' | 'OVERLOAD';
}

// WBSエントリ関連の型定義
export interface WBSEntry {
  id: string;
  name: string;
  description?: string;
  taskId?: string;
  projectId?: string;
  phaseId?: string;
  assigneeId?: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  estimatedHours: number;
  actualStartDate?: Date;
  actualEndDate?: Date;
  actualHours: number;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // リレーション
  task?: Task;
  project?: Project;
  phase?: Phase;
  assignee?: User;
}

export interface WBSEntryWithDetails extends WBSEntry {
  taskName?: string;
  projectName?: string;
  phaseName?: string;
  assigneeName?: string;
}

// ガントチャート用の拡張型
export interface GanttTask {
  id: string;
  name: string;
  type: 'task' | 'wbs';
  projectName?: string;
  phaseName?: string;
  assigneeName?: string;
  status: TaskStatus;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedHours: number;
  actualHours: number;
  progress: number; // 0-100の進捗率
}

// WBS編集用のフォームデータ
export interface WBSFormData {
  name: string;
  description?: string;
  taskId?: string;
  projectId?: string;
  assigneeId?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  estimatedHours: number;
  actualStartDate?: string;
  actualEndDate?: string;
  actualHours: number;
  status: TaskStatus;
}

export interface ProjectTimelineReport {
  projectId: string;
  projectName: string;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  delayDays: number;
  criticalPath: Task[];
  riskTasks: Task[]; // 遅延リスクのあるタスク
}

export interface WBSEfficiencyReport {
  period: { start: Date; end: Date };
  taskCompletionRate: number;
  averageTaskDuration: number;
  onTimeCompletionRate: number;
  mostEfficientAssignees: {
    assigneeId: string;
    assigneeName: string;
    efficiency: number;
  }[];
  bottleneckPhases: {
    phaseId: string;
    phaseName: string;
    delayDays: number;
  }[];
}

// カレンダー表示用のタスクデータ
export interface CalendarTask {
  id: string;
  name: string;
  projectName: string;
  phaseName: string;
  assigneeName?: string;
  status: TaskStatus;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  estimatedHours: number;
  actualHours: number;
}

// WBSエクスポート用データ
export interface WBSExportData {
  format: 'csv' | 'pdf';
  reportType: 'progress' | 'workload' | 'timeline' | 'efficiency';
  dateRange: { start: Date; end: Date };
  projectIds?: string[];
  data: any;
}

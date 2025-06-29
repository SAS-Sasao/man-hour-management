import { Phase, Task, TaskStatus } from '@/types';

export const DEFAULT_PHASES = [
  { name: '要件定義', description: 'システム要件の定義と分析' },
  { name: '基本設計', description: 'システム全体の基本設計' },
  { name: '開発', description: 'プログラム開発・実装' },
  { name: 'テスト', description: 'システムテスト・品質確認' },
  { name: 'インフラ関連', description: 'インフラ構築・設定' },
  { name: '管理', description: 'プロジェクト管理・進行管理' },
  { name: 'その他', description: 'その他の作業' }
];

export const DEFAULT_TASKS = [
  { name: '会議', description: '各種会議・打ち合わせ' },
  { name: '設計書作成', description: '設計書の作成・更新' },
  { name: '仕様書作成', description: '仕様書の作成・更新' },
  { name: 'コーディング', description: 'プログラムコーディング' },
  { name: '単体テスト', description: '単体テスト実施' },
  { name: '結合テスト', description: '結合テスト実施' },
  { name: '環境構築', description: '開発・テスト環境構築' },
  { name: 'アーキテクチャ作成', description: 'システムアーキテクチャ設計' },
  { name: 'プロンプト作成', description: 'AI用プロンプト作成' },
  { name: 'テーブル作成', description: 'データベーステーブル作成' },
  { name: 'CI/CD構築', description: 'CI/CDパイプライン構築' },
  { name: 'テーブル一覧作成', description: 'テーブル設計書作成' },
  { name: '画面一覧作成', description: '画面設計書作成' },
  { name: 'その他', description: 'その他の作業' }
];

export function createDefaultPhasesAndTasks(projectId: string): { phases: Phase[], tasks: Task[] } {
  const now = new Date();
  const phases: Phase[] = [];
  const tasks: Task[] = [];

  // 工程作成
  DEFAULT_PHASES.forEach((phaseData, index) => {
    const phase: Phase = {
      id: `phase-${projectId}-${index + 1}`,
      projectId,
      name: phaseData.name,
      description: phaseData.description,
      order: index + 1,
      createdAt: now,
      updatedAt: now
    };
    phases.push(phase);
  });

  // 各工程に全作業を追加
  phases.forEach(phase => {
    DEFAULT_TASKS.forEach((taskData, taskIndex) => {
      const task: Task = {
        id: `task-${phase.id}-${taskIndex + 1}`,
        phaseId: phase.id,
        projectId,
        name: taskData.name,
        description: taskData.description,
        estimatedHours: 0,
        order: taskIndex + 1,
        status: 'NOT_STARTED' as TaskStatus,
        createdAt: now,
        updatedAt: now
      };
      tasks.push(task);
    });
  });

  return { phases, tasks };
}

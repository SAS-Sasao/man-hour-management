import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const { phases, tasks } = await request.json();

    if (!phases || !tasks) {
      return NextResponse.json({ error: 'phases and tasks are required' }, { status: 400 });
    }

    const defaultDataContent = `import { Phase, Task } from '@/types';

export const DEFAULT_PHASES = ${JSON.stringify(phases, null, 2)};

export const DEFAULT_TASKS = ${JSON.stringify(tasks, null, 2)};

export function createDefaultPhasesAndTasks(projectId: string): { phases: Phase[], tasks: Task[] } {
  const now = new Date();
  const phases: Phase[] = [];
  const tasks: Task[] = [];

  // 工程作成
  DEFAULT_PHASES.forEach((phaseData, index) => {
    const phase: Phase = {
      id: \`phase-\${projectId}-\${index + 1}\`,
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
        id: \`task-\${phase.id}-\${taskIndex + 1}\`,
        phaseId: phase.id,
        projectId,
        name: taskData.name,
        description: taskData.description,
        estimatedHours: 0,
        order: taskIndex + 1,
        createdAt: now,
        updatedAt: now
      };
      tasks.push(task);
    });
  });

  return { phases, tasks };
}
`;

    const filePath = join(process.cwd(), 'src', 'utils', 'defaultData.ts');
    await writeFile(filePath, defaultDataContent, 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving default data:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
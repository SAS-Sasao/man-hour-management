import { NextResponse } from 'next/server';
import { PrismaClient, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      status,
      projectId,
      phaseId,
      taskId,
      assigneeId,
      plannedStartDate,
      plannedEndDate,
      actualStartDate,
      actualEndDate,
      estimatedHours,
      actualHours,
    } = body;

    // WBSエントリを更新
    const updatedEntry = await prisma.wBSEntry.update({
      where: { id },
      data: {
        name,
        description,
        status: status as TaskStatus,
        projectId: projectId || null,
        phaseId: phaseId || null,
        taskId: taskId || null,
        assigneeId: assigneeId || null,
        plannedStartDate: plannedStartDate ? new Date(plannedStartDate) : null,
        plannedEndDate: plannedEndDate ? new Date(plannedEndDate) : null,
        actualStartDate: actualStartDate ? new Date(actualStartDate) : null,
        actualEndDate: actualEndDate ? new Date(actualEndDate) : null,
        estimatedHours: parseFloat(estimatedHours) || 0,
        actualHours: parseFloat(actualHours) || 0,
        updatedAt: new Date(),
      },
      include: {
        task: {
          include: {
            phase: true,
          },
        },
        project: true,
        phase: true,
        assignee: true,
      },
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('WBSエントリ更新エラー:', error);
    return NextResponse.json(
      { error: 'WBSエントリの更新に失敗しました' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // WBSエントリを削除
    await prisma.wBSEntry.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'WBSエントリを削除しました' });
  } catch (error) {
    console.error('WBSエントリ削除エラー:', error);
    return NextResponse.json(
      { error: 'WBSエントリの削除に失敗しました' },
      { status: 500 }
    );
  }
}

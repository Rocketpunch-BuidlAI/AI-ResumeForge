import { NextResponse } from 'next/server';
import { taskStatusMap } from '../../upload/taskStatus';

// upload/route.ts에서 정의한 taskStatusMap을 공유하기 위한 가져오기
// 참고: 실제 프로덕션에서는 Redis 등의 외부 저장소를 사용하는 것이 더 적합합니다

export async function GET(request: Request, { params }: { params: { taskId: string } }) {
  try {
    const taskId = params.taskId;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // 작업 상태 조회
    const taskStatus = taskStatusMap.get(taskId);

    if (!taskStatus) {
      return NextResponse.json({ error: 'Task not found or expired' }, { status: 404 });
    }

    // 작업 상태 반환
    return NextResponse.json({
      status: taskStatus.status,
      step: taskStatus.step,
      progress: taskStatus.progress,
      error: taskStatus.error || null,
    });
  } catch (error) {
    console.error('Error fetching task status:', error);
    return NextResponse.json({ error: 'Failed to fetch task status' }, { status: 500 });
  }
}

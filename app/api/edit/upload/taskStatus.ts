// 작업 상태를 저장할 Map
// 실제 프로덕션에서는 Redis 등의 외부 저장소를 사용하는 것이 좋습니다
export const taskStatusMap = new Map<
  string,
  {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    step: string;
    progress: number;
    error?: string;
    data?: unknown;
  }
>();

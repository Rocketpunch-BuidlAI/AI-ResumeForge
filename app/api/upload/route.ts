// import { NextRequest, NextResponse } from 'next/server';

// export async function POST(request: NextRequest) {
//   try {
//     // JSON 데이터 파싱
//     const { text, metadata } = await request.json();
    
//     // 필수 필드 검증
//     if (!text) {
//       return NextResponse.json(
//         { status: 'error', message: '텍스트가 필요합니다.' },
//         { status: 400 }
//       );
//     }

//     // 성공 응답 반환
//     return NextResponse.json({
//       status: aiAgentResponse.status,
//       message: aiAgentResponse.message,
//     }, { status: 200 });
    
//   } catch (error) {
//     console.error('Upload error:', error);
//     return NextResponse.json(
//       { status: 'error', message: '업로드 처리에 실패했습니다.' },
//       { status: 500 }
//     );
//   }
// }
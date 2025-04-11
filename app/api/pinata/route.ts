import { NextResponse } from 'next/server';
import { pinata } from '@/utils/config';
import { saveCoverletter } from '@/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json('파일과 사용자 ID가 필요합니다.', { status: 400 });
    }

    const { cid } = await pinata.upload.public.file(file);
    const url = await pinata.gateways.public.convert(cid);

    // 데이터베이스에 저장
    await saveCoverletter(Number(userId), cid, url);

    return NextResponse.json({ url, cid });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json('파일 업로드 중 오류가 발생했습니다.', { status: 500 });
  }
}

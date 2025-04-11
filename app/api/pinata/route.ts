import { NextResponse } from 'next/server';
import { pinata } from '@/utils/config';
import { saveCoverletter } from '@/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json('File and user ID are required.', { status: 400 });
    }

    const { cid } = await pinata.upload.public.file(file);
    const url = await pinata.gateways.public.convert(cid);

    // save in database
    await saveCoverletter(Number(userId), cid, url);

    return NextResponse.json({ url, cid });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      'An error occurred while uploading the file.',
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { pinata } from '@/utils/config';
import { saveCoverletter } from '@/db';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;
    const metadata = formData.get('metadata') as string;

    console.log('metadata', metadata);

    if (!file || !userId) {
      return NextResponse.json('File and user ID are required.', { status: 400 });
    }

    // Get the complete response object
    const uploadResponse = await pinata.upload.public.file(file);
    console.log('uploadResponse', uploadResponse);
    const { cid } = uploadResponse;
    const url = await pinata.gateways.public.convert(cid);

    console.log('url', url);

    // Save to database with metadata
    await saveCoverletter(Number(userId), cid, url, metadata);

    // Return both CID and complete uploadResponse
    return NextResponse.json({ url, cid, uploadResponse });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json('An error occurred while uploading the file.', { status: 500 });
  }
}

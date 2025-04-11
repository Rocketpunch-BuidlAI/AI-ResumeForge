import { NextResponse } from "next/server";

// TODO: 상호님이 구현해주신 API 호출
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get('user');
  return NextResponse.json(user);
}

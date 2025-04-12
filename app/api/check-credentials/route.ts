import { NextResponse } from 'next/server';
import { getUser } from '@/db';
import { compare } from 'bcrypt-ts';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await getUser(email);

    if (user.length === 0) {
      return NextResponse.json(
        { success: false, error: '이메일 또는 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    const passwordsMatch = await compare(password, user[0].password!);
    if (!passwordsMatch) {
      return NextResponse.json(
        { success: false, error: '이메일 또는 비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error checking credentials:', error);
    return NextResponse.json(
      { success: false, error: '자격 증명 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

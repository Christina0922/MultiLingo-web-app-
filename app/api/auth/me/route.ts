import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  // NextAuth 세션 확인
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    // NextAuth로 로그인한 경우
    const user = await getCurrentUser();
    return NextResponse.json({ 
      user: {
        id: (session.user as any).id,
        email: session.user.email,
        plan: (session.user as any).plan || 'FREE',
      }
    });
  }

  // 기존 JWT 세션 확인
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { error: '인증되지 않았습니다.' },
      { status: 401 }
    );
  }

  return NextResponse.json({ user });
}


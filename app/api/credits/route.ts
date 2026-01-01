import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAvailableCredits } from '@/lib/credits';

export async function GET() {
  const user = await getCurrentUser();
  
  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const available = await getAvailableCredits(user.id, user.plan);
  
  return NextResponse.json({
    available,
    plan: user.plan,
  });
}


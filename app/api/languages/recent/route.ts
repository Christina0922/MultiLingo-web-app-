import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const recent = await prisma.recentLanguage.findMany({
    where: { userId: user.id },
    orderBy: { usedAt: 'desc' },
    take: 10,
    select: { langCode: true },
    distinct: ['langCode'],
  });

  return NextResponse.json({
    recent: recent.map(r => r.langCode),
  });
}


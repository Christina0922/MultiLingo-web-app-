import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const favorites = await prisma.languageFavorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' },
    select: { langCode: true },
  });

  return NextResponse.json({
    favorites: favorites.map(f => f.langCode),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { langCode } = z.object({ langCode: z.string() }).parse(body);

  await prisma.languageFavorite.create({
    data: {
      userId: user.id,
      langCode,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { langCode } = z.object({ langCode: z.string() }).parse(body);

  await prisma.languageFavorite.deleteMany({
    where: {
      userId: user.id,
      langCode,
    },
  });

  return NextResponse.json({ success: true });
}


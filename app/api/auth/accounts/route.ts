import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { prisma } from '@/lib/db';

// 현재 사용자의 연결된 계정 목록 조회
export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const userId = (session.user as any).id;
  
  // Prisma 클라이언트에 Account 모델이 포함되어 있지만 TypeScript가 인식하지 못할 수 있음
  // 서버 재시작 후에도 에러가 지속되면: npx prisma generate
  const accounts = await (prisma as any).account.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      type: true,
      providerAccountId: true,
    },
    orderBy: { provider: 'asc' },
  });

  return NextResponse.json({ accounts });
}

// 계정 연결 해제
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get('id');

  if (!accountId) {
    return NextResponse.json(
      { error: '계정 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  const userId = (session.user as any).id;

  // 계정이 현재 사용자의 것인지 확인
  const account = await (prisma as any).account.findUnique({
    where: { id: accountId },
    select: { userId: true },
  });

  if (!account || account.userId !== userId) {
    return NextResponse.json(
      { error: '권한이 없습니다.' },
      { status: 403 }
    );
  }

  // 마지막 계정인지 확인 (모든 계정 삭제 방지)
  const accountCount = await (prisma as any).account.count({
    where: { userId },
  });

  if (accountCount <= 1) {
    return NextResponse.json(
      { error: '최소 하나의 계정은 유지해야 합니다.' },
      { status: 400 }
    );
  }

  await (prisma as any).account.delete({
    where: { id: accountId },
  });

  return NextResponse.json({ success: true });
}


import { prisma } from './db';
import { PLAN_CREDITS } from './constants';
import { Plan } from '@prisma/client';

export async function getAvailableCredits(userId: string, plan: Plan): Promise<number> {
  const now = new Date();
  let resetAt: Date;
  let usedCredits = 0;

  if (plan === 'FREE') {
    // 일일 리셋 (자정 기준)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    resetAt = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const ledger = await prisma.creditLedger.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });
    usedCredits = ledger?.usedCredits || 0;
  } else {
    // 월간 리셋 (매월 1일)
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    const ledger = await prisma.creditLedger.findUnique({
      where: {
        userId_date: {
          userId,
          date: firstOfMonth,
        },
      },
    });
    usedCredits = ledger?.usedCredits || 0;
  }

  const totalCredits = PLAN_CREDITS[plan];
  return Math.max(0, totalCredits - usedCredits);
}

export function calculateCredits(text: string, langCount: number): number {
  // 공백, 줄바꿈, 이모지, 특수문자 모두 포함
  const charCount = text.length;
  return charCount * langCount;
}

export async function deductCredits(
  userId: string,
  credits: number,
  plan: Plan
): Promise<{ success: boolean; remaining: number; message?: string }> {
  const available = await getAvailableCredits(userId, plan);
  
  if (available < credits) {
    return {
      success: false,
      remaining: available,
      message: `크레딧이 부족합니다. 필요: ${credits}, 남은: ${available}`,
    };
  }

  const now = new Date();
  let date: Date;
  let resetAt: Date;

  if (plan === 'FREE') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date = today;
    resetAt = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  } else {
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    date = firstOfMonth;
    resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  await prisma.creditLedger.upsert({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
    update: {
      usedCredits: {
        increment: credits,
      },
    },
    create: {
      userId,
      date,
      usedCredits: credits,
      resetAt,
    },
  });

  const newRemaining = available - credits;
  return {
    success: true,
    remaining: newRemaining,
  };
}

export async function grantCredits(userId: string, credits: number) {
  // 추가 크레딧 팩 구매 시 사용
  // 실제로는 별도 테이블이나 필드로 관리하는 것이 좋지만,
  // 간단하게 현재 기간에 추가 크레딧을 부여하는 방식으로 구현
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true },
  });

  if (!user) throw new Error('User not found');

  const now = new Date();
  let date: Date;
  let resetAt: Date;

  if (user.plan === 'FREE') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    date = today;
    resetAt = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  } else {
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    date = firstOfMonth;
    resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  // 음수로 차감하여 크레딧을 추가 (또는 별도 필드 사용)
  await prisma.creditLedger.upsert({
    where: {
      userId_date: {
        userId,
        date,
      },
    },
    update: {
      usedCredits: {
        decrement: credits, // 차감을 줄여서 크레딧 추가
      },
    },
    create: {
      userId,
      date,
      usedCredits: -credits, // 음수로 시작
      resetAt,
    },
  });
}


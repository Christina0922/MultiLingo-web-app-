import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAvailableCredits, calculateCredits, deductCredits } from '@/lib/credits';
import { translateToMultipleLanguages, translateLongText } from '@/lib/translation';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';
import { z } from 'zod';

const translateSchema = z.object({
  text: z.string().min(1),
  targetLangs: z.array(z.string()).min(1),
  sourceLang: z.string().default('ko'),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, targetLangs, sourceLang } = translateSchema.parse(body);

    // 레이트 리밋 체크 (IP 기반)
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const rateLimit = checkRateLimit(`translate:${user.id}:${ip}`, 100, 60000); // 1분에 100회
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
          resetAt: rateLimit.resetAt,
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
          },
        }
      );
    }

    // 크레딧 계산
    const requiredCredits = calculateCredits(text, targetLangs.length);
    const available = await getAvailableCredits(user.id, user.plan);

    // 크레딧 부족 체크
    if (available < requiredCredits) {
      return NextResponse.json(
        {
          error: 'INSUFFICIENT_CREDITS',
          required: requiredCredits,
          available,
          message: `크레딧이 부족합니다. 필요: ${requiredCredits}, 남은: ${available}`,
        },
        { status: 402 }
      );
    }

    // 캐시 확인 (전체 언어 조합)
    const cacheHash = crypto.createHash('sha256')
      .update(`ko:${targetLangs.sort().join(',')}:${text}`)
      .digest('hex');
    
    const allCached = await prisma.translationCache.findMany({
      where: {
        sourceText: text,
        sourceLang: 'ko',
        targetLang: { in: targetLangs },
      },
    });

    const cachedLangs = new Set(allCached.map(c => c.targetLang));
    const allCachedHit = targetLangs.every(lang => cachedLangs.has(lang));
    
    // 캐시 히트 시 크레딧 10%만 차감 (또는 0%로 설정 가능)
    const actualCreditsToDeduct = allCachedHit 
      ? Math.ceil(requiredCredits * 0.1) // 10% 차감
      : requiredCredits;

    // 번역 실행
    let results: Record<string, string>;
    const isLongText = text.length > 2000;
    
    if (isLongText) {
      results = await translateLongText(text, targetLangs, sourceLang);
    } else {
      results = await translateToMultipleLanguages(text, targetLangs, sourceLang);
    }

    // 크레딧 차감
    const deductResult = await deductCredits(user.id, actualCreditsToDeduct, user.plan);
    
    if (!deductResult.success) {
      // 차감 실패 시에도 결과는 반환 (이미 번역 완료)
      console.error('Credit deduction failed:', deductResult.message);
    }

    // 히스토리 저장
    await prisma.history.create({
      data: {
        userId: user.id,
        sourceText: text,
        selectedLangs: targetLangs,
        results: JSON.stringify(results),
        creditsUsed: requiredCredits,
      },
    });

    // 최근 사용 언어 업데이트
    for (const lang of targetLangs) {
      await prisma.recentLanguage.upsert({
        where: {
          userId_langCode: {
            userId: user.id,
            langCode: lang,
          },
        },
        update: {
          usedAt: new Date(),
        },
        create: {
          userId: user.id,
          langCode: lang,
          usedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      results,
      creditsUsed: actualCreditsToDeduct,
      originalCredits: requiredCredits,
      remaining: deductResult.remaining,
      isLongText,
      fromCache: allCachedHit,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: '번역 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


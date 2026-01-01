import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import Stripe from 'stripe';
import { z } from 'zod';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const checkoutSchema = z.object({
  type: z.enum([
    'SUBSCRIPTION_PLUS_MONTHLY',
    'SUBSCRIPTION_PLUS_YEARLY',
    'SUBSCRIPTION_PRO_MONTHLY',
    'SUBSCRIPTION_PRO_YEARLY',
    'TOPUP_S',
    'TOPUP_M',
    'TOPUP_L',
  ]),
});

const PRICE_IDS: Record<string, string> = {
  SUBSCRIPTION_PLUS_MONTHLY: process.env.STRIPE_PRICE_PLUS_MONTHLY || '',
  SUBSCRIPTION_PLUS_YEARLY: process.env.STRIPE_PRICE_PLUS_YEARLY || '',
  SUBSCRIPTION_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
  SUBSCRIPTION_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || '',
};

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
    const { type } = checkoutSchema.parse(body);

    const origin = request.headers.get('origin') || 'http://localhost:3000';

    // 구독인 경우
    if (type.startsWith('SUBSCRIPTION_')) {
      const priceId = PRICE_IDS[type];
      if (!priceId) {
        return NextResponse.json(
          { error: '가격 정보를 찾을 수 없습니다.' },
          { status: 400 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        customer_email: user.email,
        client_reference_id: user.id,
        success_url: `${origin}/pricing?success=true&type=${type}`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          userId: user.id,
          type,
        },
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    // 추가 크레딧 팩인 경우
    if (type.startsWith('TOPUP_')) {
      const { TOPUP_PACKS } = await import('@/lib/constants');
      const pack = TOPUP_PACKS[type.replace('TOPUP_', '') as 'S' | 'M' | 'L'];
      
      if (!pack) {
        return NextResponse.json(
          { error: '팩 정보를 찾을 수 없습니다.' },
          { status: 400 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'krw',
              product_data: {
                name: `크레딧 팩 ${type.replace('TOPUP_', '')}`,
                description: `${pack.credits.toLocaleString()} 크레딧`,
              },
              unit_amount: pack.price,
            },
            quantity: 1,
          },
        ],
        customer_email: user.email,
        client_reference_id: user.id,
        success_url: `${origin}/pricing?success=true&type=${type}`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          userId: user.id,
          type,
          credits: pack.credits.toString(),
        },
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    return NextResponse.json(
      { error: '잘못된 요청입니다.' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: '결제 세션 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


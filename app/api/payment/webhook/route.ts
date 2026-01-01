import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/db';
import { grantCredits } from '@/lib/credits';
import { PLAN_CREDITS, TOPUP_PACKS } from '@/lib/constants';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.userId;
      const type = session.metadata?.type;

      if (!userId || !type) {
        console.error('Missing userId or type in session metadata');
        return NextResponse.json({ received: true });
      }

      // 구독인 경우
      if (type.startsWith('SUBSCRIPTION_')) {
        let plan: 'PLUS' | 'PRO' = 'PLUS';
        if (type.includes('PRO')) {
          plan = 'PRO';
        }

        await prisma.user.update({
          where: { id: userId },
          data: { plan },
        });

        // 구독 시작 시 크레딧 부여
        const credits = PLAN_CREDITS[plan];
        await grantCredits(userId, credits);
      }

      // 추가 크레딧 팩인 경우
      if (type.startsWith('TOPUP_')) {
        const packSize = type.replace('TOPUP_', '') as 'S' | 'M' | 'L';
        const pack = TOPUP_PACKS[packSize];
        
        if (pack) {
          await grantCredits(userId, pack.credits);
        }
      }

      // 구매 기록 저장
      const amount = session.amount_total || 0;
      const creditsGranted = type.startsWith('TOPUP_')
        ? parseInt(session.metadata?.credits || '0')
        : type.includes('PLUS')
        ? PLAN_CREDITS.PLUS
        : PLAN_CREDITS.PRO;

      await prisma.purchase.create({
        data: {
          userId,
          type: type as any,
          amount: amount,
          creditsGranted,
          providerRef: session.id,
        },
      });
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      // 구독 취소 시 FREE 플랜으로 변경
      // 실제로는 subscription.metadata에서 userId를 가져와야 함
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}


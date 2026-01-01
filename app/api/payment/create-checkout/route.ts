import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

/**
 * Stripe API Version 주의:
 * - 현재 프로젝트의 stripe 타입 정의가 "2023-10-16"만 허용하는 상태입니다.
 * - 타입 에러 방지를 위해 apiVersion을 고정합니다.
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2023-10-16",
});

const checkoutSchema = z.object({
  type: z.enum([
    "SUBSCRIPTION_PLUS_MONTHLY",
    "SUBSCRIPTION_PLUS_YEARLY",
    "SUBSCRIPTION_PRO_MONTHLY",
    "SUBSCRIPTION_PRO_YEARLY",
    "TOPUP_S",
    "TOPUP_M",
    "TOPUP_L",
  ]),
});

type CheckoutType = z.infer<typeof checkoutSchema>["type"];

/**
 * 구독 결제용 Price ID 매핑
 * - TOPUP은 price_data로 즉석 생성(krw)해서 사용합니다.
 */
const PRICE_IDS: Record<
  Extract<
    CheckoutType,
    | "SUBSCRIPTION_PLUS_MONTHLY"
    | "SUBSCRIPTION_PLUS_YEARLY"
    | "SUBSCRIPTION_PRO_MONTHLY"
    | "SUBSCRIPTION_PRO_YEARLY"
  >,
  string
> = {
  SUBSCRIPTION_PLUS_MONTHLY: process.env.STRIPE_PRICE_PLUS_MONTHLY ?? "",
  SUBSCRIPTION_PLUS_YEARLY: process.env.STRIPE_PRICE_PLUS_YEARLY ?? "",
  SUBSCRIPTION_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
  SUBSCRIPTION_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY ?? "",
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getOrigin(req: NextRequest) {
  // Vercel/Next 환경에서 origin 헤더가 비어있을 수 있어 안전장치
  const origin = req.headers.get("origin");
  if (origin) return origin;

  // 혹시라도 origin이 없을 때는 host로 구성
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || "https";
  if (host) return `${proto}://${host}`;

  // 로컬 기본값
  return "http://localhost:3000";
}

function requireEnv(key: string) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env: ${key}`);
  return v;
}

export async function POST(request: NextRequest) {
  try {
    // 1) 로그인 체크
    const user = await getCurrentUser();
    if (!user) return jsonError("인증이 필요합니다.", 401);

    // 2) 입력값 검증
    const body = await request.json();
    const { type } = checkoutSchema.parse(body);

    // 3) 공통 값 준비
    const origin = getOrigin(request);

    // 4) Stripe Secret Key 확인 (없으면 빌드 성공해도 런타임에서 바로 죽기 때문에 명확히 에러)
    //    - stripe 인스턴스 생성 시 빈 문자열이라도 들어가지만, 실제 요청에서 실패할 수 있어 체크합니다.
    requireEnv("STRIPE_SECRET_KEY");

    // 5) 구독 결제
    if (type.startsWith("SUBSCRIPTION_")) {
      const priceId = PRICE_IDS[type as keyof typeof PRICE_IDS];
      if (!priceId) {
        return jsonError(
          `가격 정보를 찾을 수 없습니다. (ENV 누락: STRIPE_PRICE_*)`,
          400
        );
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        // Stripe 최신에서는 payment_method_types 생략 가능하지만, 기존 호환 위해 유지합니다.
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        customer_email: user.email ?? undefined,
        client_reference_id: user.id,
        success_url: `${origin}/pricing?success=true&type=${encodeURIComponent(
          type
        )}`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          userId: user.id,
          type,
        },
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    // 6) 추가 크레딧 팩(일회성 결제)
    if (type.startsWith("TOPUP_")) {
      // TOPUP_PACKS는 constants에서 가져옵니다.
      // constants 구조가 달라도 안전하게 에러 처리합니다.
      const { TOPUP_PACKS } = await import("@/lib/constants").catch(() => ({
        TOPUP_PACKS: null,
      }));

      const key = type.replace("TOPUP_", "") as "S" | "M" | "L";
      const pack = TOPUP_PACKS?.[key];

      if (!pack || typeof pack.price !== "number" || typeof pack.credits !== "number") {
        return jsonError("팩 정보를 찾을 수 없습니다.", 400);
      }

      // Stripe unit_amount는 '원' 기준 정수(krw는 소수 없음)여야 합니다.
      const unitAmount = Math.max(0, Math.floor(pack.price));

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "krw",
              product_data: {
                name: `크레딧 팩 ${key}`,
                description: `${pack.credits.toLocaleString()} 크레딧`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        customer_email: user.email ?? undefined,
        client_reference_id: user.id,
        success_url: `${origin}/pricing?success=true&type=${encodeURIComponent(
          type
        )}`,
        cancel_url: `${origin}/pricing?canceled=true`,
        metadata: {
          userId: user.id,
          type,
          credits: String(pack.credits),
        },
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    // 7) 그 외
    return jsonError("잘못된 요청입니다.", 400);
  } catch (error: unknown) {
    // Zod 입력 오류
    if (error instanceof z.ZodError) {
      return jsonError("입력값이 올바르지 않습니다.", 400);
    }

    // ENV 누락 등
    if (error instanceof Error && error.message.startsWith("Missing env:")) {
      return jsonError(
        `서버 설정이 필요합니다. ${error.message.replace("Missing env:", "").trim()}`,
        500
      );
    }

    console.error("Checkout error:", error);
    return jsonError("결제 세션 생성 중 오류가 발생했습니다.", 500);
  }
}

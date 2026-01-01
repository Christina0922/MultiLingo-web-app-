// 플랜 및 크레딧 상수

export const PLAN_CREDITS = {
  FREE: 30_000, // 일일
  PLUS: 3_000_000, // 월간
  PRO: 12_000_000, // 월간
} as const;

export const PLAN_PRICES = {
  PLUS_MONTHLY: 6_900,
  PLUS_YEARLY: 69_000,
  PRO_MONTHLY: 19_900,
  PRO_YEARLY: 199_000,
} as const;

export const TOPUP_PACKS = {
  S: { credits: 500_000, price: 1_500 },
  M: { credits: 2_000_000, price: 4_900 },
  L: { credits: 6_000_000, price: 12_900 },
} as const;

export const PLAN_LIMITS = {
  FREE: {
    favorites: 10,
    history: 20,
    ads: true,
  },
  PLUS: {
    favorites: Infinity,
    history: 500,
    ads: false,
  },
  PRO: {
    favorites: Infinity,
    history: Infinity,
    ads: false,
    priority: true,
    export: true,
    longTextMode: true,
  },
} as const;


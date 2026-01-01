'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreditDisplay from '@/components/CreditDisplay';
import { PLAN_PRICES, TOPUP_PACKS } from '@/lib/constants';

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    checkAuth();
    checkPaymentResult();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const checkPaymentResult = () => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success) {
      alert('결제가 완료되었습니다!');
      checkAuth();
      router.push('/');
    } else if (canceled) {
      alert('결제가 취소되었습니다.');
    }
  };

  const handleCheckout = async (type: string) => {
    if (!user) {
      alert('로그인이 필요합니다.');
      router.push('/');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payment/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || '결제 세션 생성에 실패했습니다.');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">MultiLingo</h1>
            <div className="flex items-center gap-4">
              {user && <CreditDisplay />}
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← 홈으로
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">플랜 선택</h2>
          <p className="text-gray-600">원하는 플랜을 선택하세요</p>
        </div>

        {/* 구독 플랜 */}
        <div className="mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gray-100 rounded-lg p-1 inline-flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-md ${
                  billingCycle === 'monthly'
                    ? 'bg-white shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                월간
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-md ${
                  billingCycle === 'yearly'
                    ? 'bg-white shadow-sm'
                    : 'text-gray-600'
                }`}
              >
                연간 (약 17% 할인)
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Plus 플랜 */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-200">
              <h3 className="text-2xl font-bold mb-2">Plus</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">
                  {formatPrice(
                    billingCycle === 'monthly'
                      ? PLAN_PRICES.PLUS_MONTHLY
                      : PLAN_PRICES.PLUS_YEARLY
                  )}
                </span>
                <span className="text-gray-600">원</span>
                {billingCycle === 'yearly' && (
                  <span className="text-sm text-gray-500 ml-2">
                    /월 (연간 결제)
                  </span>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                <li>✓ 3,000,000 크레딧/월</li>
                <li>✓ 광고 제거</li>
                <li>✓ 즐겨찾기 무제한</li>
                <li>✓ 히스토리 500개</li>
              </ul>
              <button
                onClick={() =>
                  handleCheckout(
                    billingCycle === 'monthly'
                      ? 'SUBSCRIPTION_PLUS_MONTHLY'
                      : 'SUBSCRIPTION_PLUS_YEARLY'
                  )
                }
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '처리 중...' : '구독하기'}
              </button>
            </div>

            {/* Pro 플랜 */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-purple-200">
              <h3 className="text-2xl font-bold mb-2">Pro</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">
                  {formatPrice(
                    billingCycle === 'monthly'
                      ? PLAN_PRICES.PRO_MONTHLY
                      : PLAN_PRICES.PRO_YEARLY
                  )}
                </span>
                <span className="text-gray-600">원</span>
                {billingCycle === 'yearly' && (
                  <span className="text-sm text-gray-500 ml-2">
                    /월 (연간 결제)
                  </span>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                <li>✓ 12,000,000 크레딧/월</li>
                <li>✓ Plus 모든 기능 포함</li>
                <li>✓ 우선 처리</li>
                <li>✓ 내보내기 (CSV/텍스트)</li>
                <li>✓ 긴 글 모드 개선</li>
              </ul>
              <button
                onClick={() =>
                  handleCheckout(
                    billingCycle === 'monthly'
                      ? 'SUBSCRIPTION_PRO_MONTHLY'
                      : 'SUBSCRIPTION_PRO_YEARLY'
                  )
                }
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? '처리 중...' : '구독하기'}
              </button>
            </div>
          </div>
        </div>

        {/* 추가 크레딧 팩 */}
        <div>
          <h3 className="text-2xl font-bold mb-6 text-center">추가 크레딧 팩</h3>
          <div className="grid md:grid-cols-3 gap-6">
            {Object.entries(TOPUP_PACKS).map(([size, pack]) => (
              <div
                key={size}
                className="bg-white rounded-lg shadow-md p-6 border border-gray-200"
              >
                <h4 className="text-xl font-bold mb-2">팩 {size}</h4>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(pack.credits)}
                  </div>
                  <div className="text-sm text-gray-600">크레딧</div>
                </div>
                <div className="mb-4">
                  <span className="text-2xl font-bold">
                    {formatPrice(pack.price)}
                  </span>
                  <span className="text-gray-600">원</span>
                </div>
                <button
                  onClick={() => handleCheckout(`TOPUP_${size}`)}
                  disabled={loading}
                  className="w-full bg-gray-600 text-white py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  {loading ? '처리 중...' : '구매하기'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}


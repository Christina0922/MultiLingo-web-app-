'use client';

import { useEffect, useState } from 'react';

interface CreditInfo {
  available: number;
  plan: string;
}

export default function CreditDisplay() {
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/credits');
      if (res.ok) {
        const data = await res.json();
        setCredits(data);
      }
    } catch (error) {
      console.error('Failed to fetch credits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
    const interval = setInterval(fetchCredits, 30000); // 30초마다 갱신
    return () => clearInterval(interval);
  }, []);

  if (loading || !credits) {
    return (
      <div className="bg-gray-100 px-4 py-2 rounded-md">
        <span className="text-sm text-gray-600">로딩 중...</span>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  return (
    <div className="bg-blue-50 px-4 py-2 rounded-md border border-blue-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          남은 크레딧: <span className="text-blue-600 font-bold">{formatNumber(credits.available)}</span>
        </span>
        <span className="text-xs text-gray-500">
          플랜: {credits.plan === 'FREE' ? '무료' : credits.plan === 'PLUS' ? 'Plus' : 'Pro'}
        </span>
      </div>
    </div>
  );
}


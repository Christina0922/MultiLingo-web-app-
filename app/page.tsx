'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthModal from '@/components/AuthModal';
import CreditDisplay from '@/components/CreditDisplay';
import LanguageSelector from '@/components/LanguageSelector';
import { calculateCredits } from '@/lib/credits';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [text, setText] = useState('');
  const [selectedLangs, setSelectedLangs] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuth();
    loadLanguages();
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

  const loadLanguages = async () => {
    try {
      const [favRes, recentRes] = await Promise.all([
        fetch('/api/languages/favorites'),
        fetch('/api/languages/recent'),
      ]);

      if (favRes.ok) {
        const favData = await favRes.json();
        setFavorites(favData.favorites || []);
      }

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecent(recentData.recent || []);
      }
    } catch (error) {
      console.error('Failed to load languages:', error);
    }
  };

  const handleTranslate = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }

    if (!text.trim()) {
      setError('번역할 텍스트를 입력해주세요.');
      return;
    }

    if (selectedLangs.length === 0) {
      setError('최소 하나 이상의 언어를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const requiredCredits = calculateCredits(text, selectedLangs.length);
      
      // 크레딧 확인
      const creditsRes = await fetch('/api/credits');
      if (!creditsRes.ok) throw new Error('크레딧 정보를 가져올 수 없습니다.');
      
      const creditsData = await creditsRes.json();
      if (creditsData.available < requiredCredits) {
        setError(`크레딧이 부족합니다. 필요: ${requiredCredits.toLocaleString()}, 남은: ${creditsData.available.toLocaleString()}`);
        setLoading(false);
        return;
      }

      // 번역 실행
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLangs: selectedLangs,
          sourceLang: 'ko',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'INSUFFICIENT_CREDITS') {
          const errorMsg = `크레딧이 부족합니다. 필요: ${data.required.toLocaleString()}, 남은: ${data.available.toLocaleString()}`;
          setError(errorMsg);
          // 한도 초과 시 선택지 제공
          if (window.confirm(`${errorMsg}\n\n결제 페이지로 이동하시겠습니까?`)) {
            router.push('/pricing');
          }
        } else if (data.error === 'RATE_LIMIT_EXCEEDED') {
          setError(data.message || '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(data.error || '번역 중 오류가 발생했습니다.');
        }
        return;
      }

      // 결과 페이지로 이동 (쿼리 파라미터로 전달)
      const params = new URLSearchParams({
        text,
        langs: selectedLangs.join(','),
        results: JSON.stringify(data.results),
        creditsUsed: data.creditsUsed.toString(),
        remaining: data.remaining.toString(),
      });

      router.push(`/result?${params.toString()}`);
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
      console.error('Translation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const charCount = text.length;
  const estimatedCredits = selectedLangs.length * charCount;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">MultiLingo</h1>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <CreditDisplay />
                  <button
                    onClick={async () => {
                      await fetch('/api/auth/logout', { method: 'POST' });
                      setUser(null);
                      router.refresh();
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  로그인
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* 한국어 입력 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              한국어 텍스트 입력
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="번역할 한국어 텍스트를 입력하세요..."
              className="w-full h-40 px-4 py-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2 text-sm text-gray-500">
              글자 수: {charCount.toLocaleString()}
            </div>
          </div>

          {/* 언어 선택 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              번역 언어 선택
            </label>
            <LanguageSelector
              selected={selectedLangs}
              onChange={setSelectedLangs}
              favorites={favorites}
              recent={recent}
              maxFavorites={10}
            />
            <div className="mt-2 text-sm text-gray-500">
              선택된 언어: {selectedLangs.length}개
            </div>
          </div>

          {/* 예상 크레딧 */}
          {selectedLangs.length > 0 && charCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="text-sm">
                <div className="font-medium mb-1">예상 차감 크레딧</div>
                <div className="text-lg font-bold text-yellow-800">
                  {estimatedCredits.toLocaleString()} 크레딧
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  (입력 글자 수 {charCount.toLocaleString()} × 선택 언어 수 {selectedLangs.length})
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800 text-sm mb-3">{error}</div>
              {error.includes('크레딧이 부족합니다') && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      if (selectedLangs.length > 1) {
                        setSelectedLangs(selectedLangs.slice(0, -1));
                        setError('');
                      } else {
                        alert('최소 1개의 언어는 선택해야 합니다.');
                      }
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                  >
                    언어 줄이기
                  </button>
                  <button
                    onClick={() => router.push('/pricing')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    결제하기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 번역 버튼 */}
          <button
            onClick={handleTranslate}
            disabled={loading || !text.trim() || selectedLangs.length === 0}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? '번역 중...' : '번역하기'}
          </button>
        </div>
      </main>

      {/* 인증 모달 */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          checkAuth();
          loadLanguages();
        }}
      />
    </div>
  );
}


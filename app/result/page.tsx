'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreditDisplay from '@/components/CreditDisplay';
import { getLanguage, LANGUAGES } from '@/lib/languages';

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [showOriginal, setShowOriginal] = useState(true);

  const text = searchParams.get('text') || '';
  const langsParam = searchParams.get('langs') || '';
  const resultsParam = searchParams.get('results') || '{}';
  const creditsUsed = parseInt(searchParams.get('creditsUsed') || '0');
  const remaining = parseInt(searchParams.get('remaining') || '0');

  const selectedLangs = langsParam.split(',').filter(Boolean);
  const results: Record<string, string> = JSON.parse(resultsParam);

  useEffect(() => {
    checkAuth();
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('복사되었습니다!');
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const copyAll = async () => {
    const allText = selectedLangs
      .map(lang => {
        const langInfo = getLanguage(lang);
        return `${langInfo?.nameKo || lang}:\n${results[lang] || ''}`;
      })
      .join('\n\n');
    await copyToClipboard(allText);
  };

  const saveToHistory = async () => {
    // 이미 히스토리에 저장되어 있으므로 별도 작업 불필요
    alert('번역 결과가 히스토리에 저장되었습니다.');
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MultiLingo 번역 결과',
          text: `번역 결과:\n\n${selectedLangs.map(lang => {
            const langInfo = getLanguage(lang);
            return `${langInfo?.nameKo || lang}: ${results[lang] || ''}`;
          }).join('\n')}`,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // 폴백: 클립보드에 복사
      await copyAll();
      alert('공유 링크가 클립보드에 복사되었습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">MultiLingo</h1>
            <div className="flex items-center gap-4">
              {user && <CreditDisplay />}
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← 뒤로가기
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 상단 정보 바 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              선택 언어 수: <span className="font-medium">{selectedLangs.length}개</span>
            </div>
            <div className="text-sm text-gray-600">
              이번 차감 크레딧: <span className="font-medium text-red-600">{creditsUsed.toLocaleString()}</span>
            </div>
            {user && (
              <div className="text-sm text-gray-600">
                남은 크레딧: <span className="font-medium text-blue-600">{remaining.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* 원문 접기/펼치기 */}
          <div>
            <button
              onClick={() => setShowOriginal(!showOriginal)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showOriginal ? '▼' : '▶'} 원문 {showOriginal ? '접기' : '펼치기'}
            </button>
            {showOriginal && (
              <div className="mt-2 p-3 bg-gray-50 rounded-md border">
                <p className="text-gray-700 whitespace-pre-wrap">{text}</p>
              </div>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={copyAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            전체 복사
          </button>
          <button
            onClick={saveToHistory}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            저장
          </button>
          <button
            onClick={share}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
          >
            공유
          </button>
        </div>

        {/* 언어 수정 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
          <p className="text-sm text-yellow-800">
            언어를 수정하려면 <button onClick={() => router.push('/')} className="underline font-medium">뒤로 가서 수정</button>해주세요.
          </p>
        </div>

        {/* 번역 결과 리스트 */}
        <div className="space-y-4">
          {selectedLangs.map(lang => {
            const langInfo = getLanguage(lang);
            const translated = results[lang] || '번역 결과 없음';

            return (
              <div
                key={lang}
                className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {langInfo?.nameKo || lang}
                    {langInfo && (
                      <span className="text-sm font-normal text-gray-500 ml-2">
                        ({langInfo.nameNative})
                      </span>
                    )}
                  </h3>
                  <button
                    onClick={() => copyToClipboard(translated)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                  >
                    복사
                  </button>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {translated}
                </div>
              </div>
            );
          })}
        </div>

        {/* 하단 액션 버튼 */}
        <div className="mt-8 flex gap-2">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            새로 번역하기
          </button>
        </div>
      </main>
    </div>
  );
}


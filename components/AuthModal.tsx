'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableProviders, setAvailableProviders] = useState<{ google: boolean; kakao: boolean }>({ google: false, kakao: false });

  useEffect(() => {
    // 사용 가능한 소셜 로그인 프로바이더 확인
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => {
        setAvailableProviders({
          google: data.providers?.google === true || false,
          kakao: data.providers?.kakao === true || false,
        });
      })
      .catch(() => {
        // 에러 발생 시 기본값 유지
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    setLoading(true);
    setError('');

    try {
      // 소셜 로그인은 리다이렉트 방식으로 작동합니다
      await signIn(provider, {
        callbackUrl: window.location.origin,
        redirect: true,
      });
      
      // redirect: true일 때는 리다이렉트되므로 아래 코드는 실행되지 않습니다
    } catch (err) {
      console.error('Social login error:', err);
      setError('소셜 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '오류가 발생했습니다.');
        return;
      }

      onSuccess();
      onClose();
      setEmail('');
      setPassword('');
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isLogin ? '로그인' : '회원가입'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* 소셜 로그인 버튼 - 환경변수가 설정된 경우에만 표시 */}
        {(availableProviders.google || availableProviders.kakao) && (
          <div className="space-y-3 mb-4">
            {availableProviders.google && (
              <button
                onClick={() => handleSocialLogin('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 py-2.5 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="font-medium">Google로 로그인</span>
              </button>
            )}

            {availableProviders.kakao && (
              <button
                onClick={() => handleSocialLogin('kakao')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#000000] py-2.5 rounded-md hover:bg-[#FDD835] disabled:opacity-50 transition-colors font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.15 2 10.05c0 2.49 1.79 4.68 4.45 6.05l-1.19 4.25 4.64-2.54c.58.08 1.18.12 1.8.12 5.52 0 10-3.15 10-7.05S17.52 3 12 3z" />
                </svg>
                <span>카카오로 로그인</span>
              </button>
            )}
          </div>
        )}

        {/* 소셜 로그인 버튼이 없을 때 안내 메시지 (선택사항) */}
        {!availableProviders.google && !availableProviders.kakao && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-500">
              소셜 로그인은 관리자 설정 후 이용 가능합니다.
            </p>
          </div>
        )}

        {/* 구분선 - 소셜 로그인이 있을 때만 표시 */}
        {(availableProviders.google || availableProviders.kakao) && (
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-blue-600 hover:underline"
          >
            {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>
      </div>
    </div>
  );
}


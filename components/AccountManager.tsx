'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Account {
  id: string;
  provider: string;
  type: string;
  providerAccountId: string;
}

export default function AccountManager() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      loadAccounts();
    }
  }, [session]);

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/auth/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    if (!confirm('이 계정 연결을 해제하시겠습니까?')) {
      return;
    }

    try {
      const res = await fetch(`/api/auth/accounts?id=${accountId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadAccounts();
      } else {
        const data = await res.json();
        alert(data.error || '계정 연결 해제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to disconnect account:', error);
      alert('계정 연결 해제 중 오류가 발생했습니다.');
    }
  };

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      google: 'Google',
      kakao: 'Kakao',
      credentials: '이메일/비밀번호',
    };
    return names[provider] || provider;
  };

  if (!session || loading) {
    return null;
  }

  // 계정이 없으면 표시하지 않음
  if (accounts.length === 0) {
    return null;
  }

  return (
    <div className="relative group">
      <button className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-100">
        계정 ({accounts.length})
      </button>
      <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-lg shadow-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        <div className="text-xs font-medium text-gray-700 mb-2">
          연결된 계정
        </div>
        <div className="space-y-1">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="flex items-center justify-between p-1.5 hover:bg-gray-50 rounded text-xs"
            >
              <span className="text-gray-700">
                {getProviderName(account.provider)}
              </span>
              {accounts.length > 1 && (
                <button
                  onClick={() => disconnectAccount(account.id)}
                  className="text-red-600 hover:text-red-800 text-xs"
                >
                  해제
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


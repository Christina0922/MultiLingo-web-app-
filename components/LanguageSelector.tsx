'use client';

import { useState, useEffect, useMemo } from 'react';
import { LANGUAGES, searchLanguages, getLanguage, type Language } from '@/lib/languages';

interface LanguageSelectorProps {
  selected: string[];
  onChange: (langs: string[]) => void;
  favorites: string[];
  recent: string[];
  maxFavorites?: number;
}

export default function LanguageSelector({
  selected,
  onChange,
  favorites,
  recent,
  maxFavorites = 10,
}: LanguageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const filteredLanguages = useMemo(() => {
    if (!searchQuery) return [];
    return searchLanguages(searchQuery);
  }, [searchQuery]);

  const selectedLanguages = useMemo(() => {
    return selected.map(code => getLanguage(code)).filter(Boolean) as Language[];
  }, [selected]);

  const favoriteLanguages = useMemo(() => {
    return favorites
      .map(code => getLanguage(code))
      .filter(Boolean)
      .slice(0, maxFavorites) as Language[];
  }, [favorites, maxFavorites]);

  const recentLanguages = useMemo(() => {
    return recent
      .map(code => getLanguage(code))
      .filter(Boolean)
      .slice(0, 10) as Language[];
  }, [recent]);

  const handleAddLanguage = (code: string) => {
    if (!selected.includes(code)) {
      onChange([...selected, code]);
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleRemoveLanguage = (code: string) => {
    onChange(selected.filter(l => l !== code));
  };

  const toggleFavorite = async (code: string) => {
    const isFavorite = favorites.includes(code);
    try {
      const res = await fetch('/api/languages/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ langCode: code }),
      });
      if (res.ok) {
        // 부모 컴포넌트에서 다시 로드하도록 처리
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* 선택된 언어 칩 */}
      {selectedLanguages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLanguages.map(lang => (
            <div
              key={lang.code}
              className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
            >
              <span className="text-sm">{lang.nameKo}</span>
              <button
                onClick={() => handleRemoveLanguage(lang.code)}
                className="text-blue-600 hover:text-blue-800"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 언어 추가 버튼 */}
      <div className="space-y-2">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-left"
        >
          {showSearch ? '언어 검색 닫기' : '+ 언어 추가'}
        </button>

        {showSearch && (
          <div className="border rounded-md p-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="언어 검색 (한글/영문/원어명)"
              className="w-full px-3 py-2 border rounded-md mb-3"
            />

            {searchQuery && filteredLanguages.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredLanguages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleAddLanguage(lang.code)}
                    disabled={selected.includes(lang.code)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    <span>
                      {lang.nameKo} ({lang.nameNative})
                    </span>
                    {selected.includes(lang.code) && (
                      <span className="text-xs text-gray-500">선택됨</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 즐겨찾기 */}
      {favoriteLanguages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">즐겨찾기</h3>
          <div className="flex flex-wrap gap-2">
            {favoriteLanguages.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleAddLanguage(lang.code)}
                disabled={selected.includes(lang.code)}
                className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm flex items-center gap-1"
              >
                <span>⭐</span>
                <span>{lang.nameKo}</span>
                {!selected.includes(lang.code) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(lang.code);
                    }}
                    className="ml-1 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 최근 사용 */}
      {recentLanguages.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">최근 사용</h3>
          <div className="flex flex-wrap gap-2">
            {recentLanguages
              .filter(lang => !favorites.includes(lang.code))
              .map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleAddLanguage(lang.code)}
                  disabled={selected.includes(lang.code)}
                  className="px-3 py-1 border rounded-md hover:bg-gray-50 disabled:opacity-50 text-sm"
                >
                  {lang.nameKo}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}


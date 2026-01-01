// 언어 데이터 정의 (ISO 639-1 기반)

export interface Language {
  code: string;
  nameKo: string;
  nameNative: string;
  nameEn: string;
  tier: 1 | 2 | 3;
}

export const LANGUAGES: Language[] = [
  // Tier 1
  { code: "en", nameKo: "영어", nameNative: "English", nameEn: "English", tier: 1 },
  { code: "ja", nameKo: "일본어", nameNative: "日本語", nameEn: "Japanese", tier: 1 },
  { code: "zh-Hans", nameKo: "중국어(간체)", nameNative: "简体中文", nameEn: "Chinese (Simplified)", tier: 1 },
  { code: "zh-Hant", nameKo: "중국어(번체)", nameNative: "繁體中文", nameEn: "Chinese (Traditional)", tier: 1 },
  { code: "es", nameKo: "스페인어", nameNative: "Español", nameEn: "Spanish", tier: 1 },
  { code: "fr", nameKo: "프랑스어", nameNative: "Français", nameEn: "French", tier: 1 },
  { code: "de", nameKo: "독일어", nameNative: "Deutsch", nameEn: "German", tier: 1 },
  { code: "pt-BR", nameKo: "포르투갈어(브라질)", nameNative: "Português (Brasil)", nameEn: "Portuguese (Brazil)", tier: 1 },
  { code: "ru", nameKo: "러시아어", nameNative: "Русский", nameEn: "Russian", tier: 1 },
  { code: "ar", nameKo: "아랍어", nameNative: "العربية", nameEn: "Arabic", tier: 1 },
  
  // Tier 2
  { code: "it", nameKo: "이탈리아어", nameNative: "Italiano", nameEn: "Italian", tier: 2 },
  { code: "nl", nameKo: "네덜란드어", nameNative: "Nederlands", nameEn: "Dutch", tier: 2 },
  { code: "pl", nameKo: "폴란드어", nameNative: "Polski", nameEn: "Polish", tier: 2 },
  { code: "tr", nameKo: "터키어", nameNative: "Türkçe", nameEn: "Turkish", tier: 2 },
  { code: "vi", nameKo: "베트남어", nameNative: "Tiếng Việt", nameEn: "Vietnamese", tier: 2 },
  { code: "id", nameKo: "인도네시아어", nameNative: "Bahasa Indonesia", nameEn: "Indonesian", tier: 2 },
  { code: "th", nameKo: "태국어", nameNative: "ไทย", nameEn: "Thai", tier: 2 },
  { code: "hi", nameKo: "힌디어", nameNative: "हिन्दी", nameEn: "Hindi", tier: 2 },
  { code: "fa", nameKo: "페르시아어", nameNative: "فارسی", nameEn: "Persian", tier: 2 },
  { code: "uk", nameKo: "우크라이나어", nameNative: "Українська", nameEn: "Ukrainian", tier: 2 },
  
  // Tier 3
  { code: "ms", nameKo: "말레이어", nameNative: "Bahasa Melayu", nameEn: "Malay", tier: 3 },
  { code: "tl", nameKo: "필리핀어(타갈로그)", nameNative: "Tagalog", nameEn: "Filipino (Tagalog)", tier: 3 },
  { code: "bn", nameKo: "벵골어", nameNative: "বাংলা", nameEn: "Bengali", tier: 3 },
  { code: "cs", nameKo: "체코어", nameNative: "Čeština", nameEn: "Czech", tier: 3 },
  { code: "hu", nameKo: "헝가리어", nameNative: "Magyar", nameEn: "Hungarian", tier: 3 },
];

export const LANGUAGE_MAP = new Map(LANGUAGES.map(lang => [lang.code, lang]));

export function getLanguage(code: string): Language | undefined {
  return LANGUAGE_MAP.get(code);
}

export function searchLanguages(query: string): Language[] {
  const lowerQuery = query.toLowerCase();
  return LANGUAGES.filter(lang => 
    lang.nameKo.toLowerCase().includes(lowerQuery) ||
    lang.nameNative.toLowerCase().includes(lowerQuery) ||
    lang.nameEn.toLowerCase().includes(lowerQuery) ||
    lang.code.toLowerCase().includes(lowerQuery)
  );
}

export function getTierLanguages(tier: 1 | 2 | 3): Language[] {
  return LANGUAGES.filter(lang => lang.tier === tier);
}


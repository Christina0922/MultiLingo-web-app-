import { prisma } from './db';
import crypto from 'crypto';
import OpenAI from 'openai';

// 번역 엔진 추상화 인터페이스
export interface TranslationProvider {
  translate(text: string, sourceLang: string, targetLang: string): Promise<string>;
}

// OpenAI 번역 구현
class OpenAIProvider implements TranslationProvider {
  private client: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async translate(text: string, sourceLang: string, targetLang: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the given text from ${sourceLang} to ${targetLang}. Only return the translated text without any explanation or additional text.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0]?.message?.content || '';
  }
}

// 캐시 키 생성
function generateCacheKey(sourceText: string, sourceLang: string, targetLang: string): string {
  const content = `${sourceLang}:${targetLang}:${sourceText}`;
  return crypto.createHash('sha256').update(content).digest('hex');
}

// 번역 실행 (캐시 우선)
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
  useCache: boolean = true
): Promise<string> {
  // 캐시 확인
  if (useCache) {
    const hash = generateCacheKey(text, sourceLang, targetLang);
    const cached = await prisma.translationCache.findUnique({
      where: { hash },
    });

    if (cached) {
      return cached.translatedText;
    }
  }

  // 번역 실행
  const provider = new OpenAIProvider();
  const translated = await provider.translate(text, sourceLang, targetLang);

  // 캐시 저장
  if (useCache) {
    const hash = generateCacheKey(text, sourceLang, targetLang);
    await prisma.translationCache.upsert({
      where: { hash },
      update: {
        translatedText: translated,
      },
      create: {
        hash,
        sourceText: text,
        sourceLang,
        targetLang,
        translatedText: translated,
      },
    });
  }

  return translated;
}

// 여러 언어로 동시 번역
export async function translateToMultipleLanguages(
  text: string,
  targetLangs: string[],
  sourceLang: string = 'ko'
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  
  // 병렬 처리로 성능 향상
  const promises = targetLangs.map(async (lang) => {
    try {
      const translated = await translateText(text, sourceLang, lang);
      return { lang, translated };
    } catch (error) {
      console.error(`Translation failed for ${lang}:`, error);
      return { lang, translated: `번역 실패: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  });

  const resolved = await Promise.all(promises);
  resolved.forEach(({ lang, translated }) => {
    results[lang] = translated;
  });

  return results;
}

// 긴 텍스트 분할 처리
export async function translateLongText(
  text: string,
  targetLangs: string[],
  sourceLang: string = 'ko',
  maxChunkSize: number = 2000
): Promise<Record<string, string>> {
  if (text.length <= maxChunkSize) {
    return translateToMultipleLanguages(text, targetLangs, sourceLang);
  }

  // 문장 단위로 분할 (간단한 구현)
  const sentences = text.split(/([.!?]\s+|[\n])/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // 각 청크를 번역하고 합치기
  const chunkResults = await Promise.all(
    chunks.map(chunk => translateToMultipleLanguages(chunk, targetLangs, sourceLang))
  );

  // 결과 합치기
  const results: Record<string, string> = {};
  targetLangs.forEach(lang => {
    results[lang] = chunkResults.map(chunk => chunk[lang] || '').join('');
  });

  return results;
}


# MultiLingo

다국어 번역 서비스 - 한국어를 여러 언어로 동시에 번역하는 웹 애플리케이션

## 기술 스택

- **프론트엔드**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **백엔드**: Next.js Route Handler (API)
- **데이터베이스**: PostgreSQL + Prisma ORM
- **인증**: JWT (jose) + 세션 쿠키
- **결제**: Stripe
- **번역 엔진**: OpenAI GPT-4o-mini

## 주요 기능

1. **다국어 동시 번역**: 한국어 텍스트를 여러 언어로 한 번에 번역
2. **크레딧 기반 과금**: 입력 문자 수 × 선택 언어 수로 크레딧 차감
3. **플랜 시스템**: Free, Plus, Pro 플랜 제공
4. **언어 관리**: 즐겨찾기, 최근 사용 언어 기능
5. **번역 캐싱**: 동일 요청 재번역 시 크레딧 절약
6. **결제 통합**: Stripe를 통한 구독 및 추가 크레딧 팩 구매

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 참고하여 `.env` 파일을 생성하고 필요한 값들을 설정하세요.

```bash
cp .env.example .env
```

### 3. 데이터베이스 설정

Prisma를 사용하여 데이터베이스를 설정합니다.

```bash
# Prisma Client 생성
npm run db:generate

# 데이터베이스 스키마 적용
npm run db:push

# 또는 마이그레이션 사용
npm run db:migrate
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
.
├── app/                    # Next.js App Router
│   ├── api/                # API 라우트
│   │   ├── auth/           # 인증 관련 API
│   │   ├── translate/      # 번역 API
│   │   ├── credits/        # 크레딧 API
│   │   ├── languages/      # 언어 관리 API
│   │   └── payment/        # 결제 API
│   ├── pricing/            # 가격 페이지
│   ├── result/             # 번역 결과 페이지
│   └── page.tsx            # 메인 페이지
├── components/             # React 컴포넌트
│   ├── AuthModal.tsx       # 인증 모달
│   ├── CreditDisplay.tsx   # 크레딧 표시
│   └── LanguageSelector.tsx # 언어 선택기
├── lib/                    # 유틸리티 및 로직
│   ├── auth.ts             # 인증 관련 함수
│   ├── credits.ts          # 크레딧 관리
│   ├── languages.ts        # 언어 데이터
│   ├── translation.ts      # 번역 로직
│   ├── constants.ts        # 상수 정의
│   └── db.ts               # Prisma 클라이언트
└── prisma/                 # Prisma 스키마
    └── schema.prisma       # 데이터베이스 스키마
```

## 플랜 및 가격

### 구독 플랜

- **Free**: 30,000 크레딧/일 (무료)
- **Plus**: 3,000,000 크레딧/월 - 월 6,900원 / 연 69,000원
- **Pro**: 12,000,000 크레딧/월 - 월 19,900원 / 연 199,000원

### 추가 크레딧 팩

- **S**: 500,000 크레딧 = 1,500원
- **M**: 2,000,000 크레딧 = 4,900원
- **L**: 6,000,000 크레딧 = 12,900원

## 크레딧 계산

- 차감 크레딧 = 입력 문자 수 × 선택 언어 수
- 공백, 줄바꿈, 이모지, 특수문자 모두 포함
- 동일 원문 + 동일 언어 조합은 캐시 사용 (차감 최소화)

## 지원 언어

Tier 1 (10개): 영어, 일본어, 중국어(간체/번체), 스페인어, 프랑스어, 독일어, 포르투갈어(브라질), 러시아어, 아랍어

Tier 2 (10개): 이탈리아어, 네덜란드어, 폴란드어, 터키어, 베트남어, 인도네시아어, 태국어, 힌디어, 페르시아어, 우크라이나어

Tier 3 (5개): 말레이어, 필리핀어(타갈로그), 벵골어, 체코어, 헝가리어

## 배포

### Vercel 배포

1. GitHub에 프로젝트 푸시
2. Vercel에서 프로젝트 import
3. 환경 변수 설정
4. 데이터베이스 연결 (Vercel Postgres 또는 외부 PostgreSQL)
5. 배포

### 환경 변수 (프로덕션)

프로덕션 환경에서는 다음 환경 변수를 설정해야 합니다:

- `DATABASE_URL`: PostgreSQL 연결 문자열
- `JWT_SECRET`: 강력한 랜덤 문자열
- `OPENAI_API_KEY`: OpenAI API 키
- `STRIPE_SECRET_KEY`: Stripe 시크릿 키
- `STRIPE_WEBHOOK_SECRET`: Stripe 웹훅 시크릿
- `STRIPE_PRICE_*`: Stripe 가격 ID들

## 라이선스

MIT


# 소셜 로그인 설정 가이드

## 문제 해결

구글/카카오 로그인 버튼이 작동하지 않는 경우, 다음을 확인하세요:

### 1. 환경 변수 설정

`.env` 또는 `.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# NextAuth
NEXTAUTH_SECRET="your-random-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Kakao OAuth
KAKAO_CLIENT_ID="your-kakao-client-id"
KAKAO_CLIENT_SECRET="your-kakao-client-secret"
```

### 2. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "API 및 서비스" > "사용자 인증 정보" 이동
4. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
5. 애플리케이션 유형: "웹 애플리케이션"
6. 승인된 리디렉션 URI 추가:
   - `http://localhost:3000/api/auth/callback/google` (개발)
   - `https://yourdomain.com/api/auth/callback/google` (프로덕션)
7. 생성된 Client ID와 Client Secret을 환경 변수에 추가

### 3. Kakao OAuth 설정

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 애플리케이션 추가하기
3. 플랫폼 설정:
   - 웹 플랫폼 등록: `http://localhost:3000` (개발)
   - Redirect URI 등록: `http://localhost:3000/api/auth/callback/kakao`
4. 제품 설정 > 카카오 로그인 활성화
5. REST API 키와 Client Secret을 환경 변수에 추가

### 4. 데이터베이스 마이그레이션

Prisma 스키마가 변경되었으므로 마이그레이션을 실행하세요:

```bash
npx prisma generate
npx prisma db push
```

### 5. 서버 재시작

환경 변수를 변경한 후 개발 서버를 재시작하세요:

```bash
npm run dev
```

## 확인 사항

- ✅ 환경 변수가 올바르게 설정되었는지
- ✅ OAuth 앱의 리디렉션 URI가 정확한지
- ✅ 데이터베이스 마이그레이션이 완료되었는지
- ✅ 서버가 재시작되었는지

## 문제 해결

### "Configuration error" 발생 시
- 환경 변수가 올바르게 설정되었는지 확인
- `.env.local` 파일이 프로젝트 루트에 있는지 확인

### 리다이렉트 오류 발생 시
- OAuth 앱의 리디렉션 URI가 정확히 일치하는지 확인
- `NEXTAUTH_URL`이 현재 도메인과 일치하는지 확인

### 로그인 후 세션이 유지되지 않는 경우
- `NEXTAUTH_SECRET`이 설정되었는지 확인
- 쿠키 설정이 올바른지 확인 (프로덕션에서는 HTTPS 필요)


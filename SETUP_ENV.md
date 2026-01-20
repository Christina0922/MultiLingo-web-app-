# 환경 변수 설정 완료 ✅

`.env.local` 파일이 생성되었습니다!

## 현재 설정된 항목

- ✅ `NEXTAUTH_SECRET` - NextAuth 시크릿 키
- ✅ `NEXTAUTH_URL` - NextAuth URL
- ✅ `JWT_SECRET` - JWT 토큰 시크릿 키

## 추가 설정이 필요한 항목

### 1. Google OAuth (구글 로그인 사용 시)

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 생성 또는 선택
3. "API 및 서비스" > "사용자 인증 정보"
4. "OAuth 클라이언트 ID" 생성
5. 리디렉션 URI 추가: `http://localhost:3000/api/auth/callback/google`
6. `.env.local` 파일에 추가:
   ```
   GOOGLE_CLIENT_ID="발급받은-클라이언트-ID"
   GOOGLE_CLIENT_SECRET="발급받은-클라이언트-시크릿"
   ```

### 2. Kakao OAuth (카카오 로그인 사용 시)

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 애플리케이션 추가
3. 플랫폼 설정:
   - 웹 플랫폼: `http://localhost:3000`
   - Redirect URI: `http://localhost:3000/api/auth/callback/kakao`
4. 카카오 로그인 활성화
5. `.env.local` 파일에 추가:
   ```
   KAKAO_CLIENT_ID="발급받은-클라이언트-ID"
   KAKAO_CLIENT_SECRET="발급받은-클라이언트-시크릿"
   ```

## 서버 재시작

환경 변수를 변경한 후 **반드시 서버를 재시작**하세요:

```bash
# 현재 실행 중인 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
npm run dev
```

## 확인 방법

서버 재시작 후 다음 URL에서 확인:
- http://localhost:3000/api/auth/check

## 현재 상태

현재는 기본 NextAuth 설정만 완료되었습니다.
구글/카카오 로그인을 사용하려면 위의 OAuth 설정을 완료해야 합니다.


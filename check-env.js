// 환경 변수 확인 스크립트
console.log('=== 환경 변수 확인 ===');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ 설정됨' : '❌ 없음');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ 없음');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ 설정됨' : '❌ 없음');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ 설정됨' : '❌ 없음');
console.log('KAKAO_CLIENT_ID:', process.env.KAKAO_CLIENT_ID ? '✅ 설정됨' : '❌ 없음');
console.log('KAKAO_CLIENT_SECRET:', process.env.KAKAO_CLIENT_SECRET ? '✅ 설정됨' : '❌ 없음');


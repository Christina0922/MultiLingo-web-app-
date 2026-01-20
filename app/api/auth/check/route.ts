import { NextResponse } from 'next/server';

export async function GET() {
  const hasGoogle = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const hasKakao = !!(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET);

  return NextResponse.json({
    status: 'ok',
    providers: {
      google: hasGoogle,
      kakao: hasKakao,
    },
  });
}


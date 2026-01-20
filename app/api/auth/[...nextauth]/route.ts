import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import KakaoProvider from 'next-auth/providers/kakao';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';

// 환경 변수 체크
const hasGoogleAuth = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const hasKakaoAuth = !!(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    ...(hasGoogleAuth
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
              params: {
                prompt: 'consent',
                access_type: 'offline',
                response_type: 'code',
              },
            },
          }),
        ]
      : []),
    ...(hasKakaoAuth
      ? [
          KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID!,
            clientSecret: process.env.KAKAO_CLIENT_SECRET!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn() {
      // PrismaAdapter가 자동으로 계정 생성/연결 처리
      // 같은 이메일로 다른 프로바이더 로그인 시 자동으로 기존 계정에 연결됨
      return true;
    },
    async session({ session, token }) {
      // 세션에 사용자 ID 추가
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).plan = token.plan as string;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // JWT에 사용자 정보 추가
      if (user) {
        token.id = user.id;
        // Prisma에서 사용자 정보 가져오기
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { plan: true },
        });
        token.plan = dbUser?.plan || 'FREE';
      }
      return token;
    },
  },
  pages: {
    signIn: '/',
    error: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


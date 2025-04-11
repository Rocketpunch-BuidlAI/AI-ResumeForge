import { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [
    Google,
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/');
      const isOnLoginPage = nextUrl.pathname.startsWith('/login');
      const isOnSignupPage = nextUrl.pathname.startsWith('/signup');

      // 회원가입 페이지로의 직접 접근은 허용
      if (isOnSignupPage) return true;

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && isOnLoginPage) {
        return Response.redirect(new URL('/', nextUrl));
      }

      return true;
    },
    redirect({ url, baseUrl }) {
      // 구글 OAuth 콜백 URL을 허용
      if (url.includes('/api/auth/callback/google')) return url;
      // 회원가입 페이지로의 리다이렉션을 허용
      if (url.includes('/signup')) return url;
      // 다른 모든 경우 기본 URL을 사용
      return baseUrl;
    }
  },
} satisfies NextAuthConfig;
import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { compare } from 'bcrypt-ts';
import { authConfig } from './auth.config';
import { getUser, createUser } from './db';
import Google from 'next-auth/providers/google';

export const auth = NextAuth({
  ...authConfig,
  providers: [
    Google,
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await getUser(credentials.email as string);
        if (user.length === 0) return null;
        const passwordsMatch = await compare(credentials.password as string, user[0].password!);
        if (passwordsMatch) {
          return {
            id: user[0].id.toString(),
            email: user[0].email,
          } as User;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existingUser = await getUser(user.email!);
        if (existingUser.length === 0) {
          // 구글 로그인 사용자를 위한 임시 비밀번호 생성
          const tempPassword = Math.random().toString(36).slice(-8);
          await createUser(user.email!, tempPassword);
        }
      }
      return true;
    },
  },
});

export const { handlers: { GET, POST }, signIn, signOut } = auth;
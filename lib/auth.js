import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { findUserByIdentifier } from '@/lib/userRepo';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Username, User ID or Email', type: 'text', placeholder: 'your_user_id or email' },
        password: { label: 'Password', type: 'password', placeholder: '••••••••' },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          throw new Error('Please provide both username/email and password.');
        }

        const rawPassword = credentials.password;
        const user = await findUserByIdentifier(credentials.identifier);

        if (!user) {
          throw new Error('No registered account found with these credentials. Please sign up.');
        }

        if (!user.password) {
          throw new Error('Account security record incomplete. Please reset your password.');
        }

        // Compare password with bcrypt hash
        const isPasswordValid = await bcrypt.compare(rawPassword, user.password);
        if (!isPasswordValid) {
          throw new Error('Incorrect password. Please try again.');
        }

        return {
          id: user.userId,
          name: user.username,
          email: user.email,
          role: user.role || 'Admin',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || 'Admin';
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role || 'Admin';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'youtube_watch_party_secret_key_jwt_session_2026',
};

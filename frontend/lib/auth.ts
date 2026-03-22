import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google'; // ✅ NEW
import { PrismaAdapter } from '@next-auth/prisma-adapter'; // ✅ NEW
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

export const authOptions: NextAuthOptions = {
  // ✅ NEW: This adapter tells NextAuth to auto-create Google users in your PostgreSQL DB
  adapter: PrismaAdapter(prisma),
  session: {
    // We force this to 'jwt' so we keep your ultra-fast, lightweight cookie sessions
    strategy: 'jwt',
  },
  providers: [
    // ✅ NEW: The Google Gateway Configuration
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),

    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // ✅ UPDATED: Prevent crash if they used Google to sign up (password_hash is null)
        if (!user || !user.password_hash) {
          throw new Error('No account found, or this email uses Google Login.');
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isValid) {
          throw new Error('Invalid password');
        }

        // Return ONLY the essentials to keep the cookie tiny
        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // When the user first logs in (via Google OR Credentials)
      if (user) {
        token.id = user.id;
        token.email = user.email as string;
      }

      // Catch the update() signal from your Profile Page
      if (trigger === "update") {
        token.refreshTrigger = Date.now();
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;

        // Fetch the heavy data (name and image) directly from the database!
        // This keeps your cookie under 4KB but perfectly syncs your Google/Local UI.
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email as string },
            select: { name: true, image: true }
          });

          if (dbUser) {
            session.user.name = dbUser.name;
            session.user.image = dbUser.image;
          }
        } catch (error) {
          console.error("Error fetching user session data:", error);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
};
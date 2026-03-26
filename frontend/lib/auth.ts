import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';
import { cookies } from 'next/headers'; // ✅ ADDED THIS IMPORT

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
  },
  providers: [
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

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],

  // ✅ UPDATED: The Events block now handles the Google Sign-up "Secret Flag"
  events: {
    async createUser({ user }) {
      if (user.email) {
        console.log(`[NextAuth Event] New user created: ${user.email}. Firing welcome email...`);

        // 1. Trigger the Welcome Email
        await sendWelcomeEmail(user.email, user.name || 'Operator');

        // 2. ✅ SET THE COOKIE: This tells the WelcomeBanner to show up 
        // regardless of which button they clicked on the login page.
        const cookieStore = await cookies();
        cookieStore.set('is_new_user', 'true', {
          maxAge: 60, // Expires in 60 seconds
          path: '/'
        });
      }
    },
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email as string;
      }

      if (trigger === "update") {
        token.refreshTrigger = Date.now();
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;

        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: session.user.email as string },
            select: { name: true, image: true, created_at: true }
          });

          if (dbUser) {
            session.user.name = dbUser.name;
            session.user.image = dbUser.image;
            session.user.createdAt = dbUser.created_at?.toISOString() ?? null;
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
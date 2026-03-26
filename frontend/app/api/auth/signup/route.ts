import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email'; // ✅ NEW: Import your email utility

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    // 1. Create the user in the database
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
      },
    });

    // ✅ 2. Trigger the welcome email for the new user
    // We await this so the serverless function doesn't shut down before Resend finishes sending
    console.log(`[Signup API] New user created: ${user.email}. Firing welcome email...`);
    await sendWelcomeEmail(user.email, 'Operator');

    // 3. Return the success response
    return NextResponse.json(
      { message: 'Account created successfully', userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SIGNUP ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
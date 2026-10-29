import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByUserId, findUserByEmail, createUserRecord } from '@/lib/userRepo';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, userId, user_id, email, password } = body;

    const rawUserId = (userId || user_id || '').trim().toLowerCase();
    const cleanUsername = (username || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const rawPassword = password || '';

    // Validation
    if (!cleanUsername || cleanUsername.length < 2) {
      return NextResponse.json(
        { error: 'Username must be at least 2 characters long.' },
        { status: 400 }
      );
    }

    if (!rawUserId || !/^[a-z0-9_-]{3,24}$/.test(rawUserId)) {
      return NextResponse.json(
        { error: 'User ID must be 3-24 characters (lowercase letters, numbers, underscores, dashes).' },
        { status: 400 }
      );
    }

    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    if (!rawPassword || rawPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }

    // Check if User ID or Email already exists
    const existingUserId = await findUserByUserId(rawUserId);
    if (existingUserId) {
      return NextResponse.json(
        { error: 'This User ID is already taken. Please choose another.' },
        { status: 409 }
      );
    }

    const existingEmail = await findUserByEmail(cleanEmail);
    if (existingEmail) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Save user
    const newUser = await createUserRecord({
      userId: rawUserId,
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: 'Admin',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Account created successfully! You can now log in.',
        user: {
          userId: newUser.userId,
          username: newUser.username,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Sign Up API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create account.' },
      { status: 500 }
    );
  }
}

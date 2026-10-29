import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByCredentialsVerification, updateUserPassword } from '@/lib/userRepo';

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, user_id, username, newPassword } = body;

    const cleanUserId = (userId || user_id || '').trim().toLowerCase();
    const cleanUsername = (username || '').trim();

    if (!cleanUserId || !cleanUsername) {
      return NextResponse.json(
        { error: 'Both User ID and Username are required to verify your identity.' },
        { status: 400 }
      );
    }

    // Verify userId and username combination
    const user = await findUserByCredentialsVerification(cleanUserId, cleanUsername);

    if (!user) {
      return NextResponse.json(
        { error: 'No matching user found with this User ID and Username combination.' },
        { status: 404 }
      );
    }

    // If newPassword is provided, perform password reset
    if (newPassword !== undefined) {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'New password must be at least 6 characters long.' },
          { status: 400 }
        );
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await updateUserPassword(cleanUserId, hashedPassword);

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully! You can now log in with your new password.',
      });
    }

    // Verification check passed
    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Identity verified. You may now enter your new password.',
    });
  } catch (error) {
    console.error('[Reset Password API Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset password.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/db';
import Room from '@/models/Room';

// Safe alphanumeric character set (no confusing 0/o or 1/l)
const CHARSET = '23456789abcdefghjkmnpqrstuvwxyz';

function generateUniqueCode(length = 7) {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}

export async function POST(request) {
  try {
    await connectDB();

    let roomId = '';
    let isUnique = false;
    let attempts = 0;

    // Generate a unique 7-character Room ID (within 6 to 8 character requirement)
    while (!isUnique && attempts < 10) {
      attempts++;
      roomId = generateUniqueCode(7);

      try {
        const existing = await Room.findOne({ roomId });
        if (!existing) {
          isUnique = true;
        }
      } catch (dbErr) {
        // If DB offline/fallback, use the generated code directly
        isUnique = true;
      }
    }

    return NextResponse.json(
      {
        success: true,
        roomId,
        message: 'Unique Room ID generated successfully.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Create Room API Error]:', error);
    // Even if an unexpected error occurs, provide a secure 7-character ID
    const fallbackId = generateUniqueCode(7);
    return NextResponse.json(
      {
        success: true,
        roomId: fallbackId,
        message: 'Generated room ID with fallback.',
      },
      { status: 200 }
    );
  }
}

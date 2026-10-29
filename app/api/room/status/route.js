import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Room from '@/models/Room';
import roomManager from '@/lib/roomManager';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get('roomId')?.trim();

    if (!roomId) {
      return NextResponse.json(
        { exists: false, error: 'roomId parameter is required' },
        { status: 400 }
      );
    }

    // 1. Check in-memory room first (instant)
    const inMemoryRoom = roomManager.getRoom(roomId);
    if (inMemoryRoom) {
      return NextResponse.json({
        exists: true,
        roomId,
        status: 'active',
        participantsCount: inMemoryRoom.participants.size,
        videoTitle: inMemoryRoom.videoState?.title || 'YouTube Stream',
      });
    }

    // 2. Check MongoDB for persistent room state
    await connectDB();
    const roomDoc = await Room.findOne({ roomId });

    if (!roomDoc || roomDoc.status === 'ended') {
      return NextResponse.json({
        exists: false,
        roomId,
        status: 'terminated',
      });
    }

    return NextResponse.json({
      exists: true,
      roomId,
      status: roomDoc.status || 'active',
      videoTitle: roomDoc.currentVideo?.title || '',
      adminId: roomDoc.adminId || roomDoc.hostId,
    });
  } catch (error) {
    console.warn('[Room Status API Error]:', error.message);
    return NextResponse.json(
      { exists: false, error: error.message },
      { status: 500 }
    );
  }
}

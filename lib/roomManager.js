/**
 * In-memory RoomManager for fast state access and WebSocket synchronization.
 * Role permission checks and states are strictly scoped to each individual roomId.
 */
class RoomManager {
  constructor() {
    // Map<roomId, RoomState>
    this.rooms = new Map();
    // Map<socketId, roomId>
    this.socketToRoom = new Map();
  }

  /**
   * Check if a user has playback control privileges inside their room (Admin or Co-Admin).
   */
  canControlPlayback(user, roomId = null) {
    if (!user || !user.role) return false;
    const effectiveRoomId = roomId || this.socketToRoom.get(user.socketId);
    if (!effectiveRoomId) return false;

    const room = this.rooms.get(effectiveRoomId);
    if (!room) return false;

    // Check against room admin and room co-admins
    if (room.adminId === user.userId || room.hostId === user.userId) return true;
    if (room.coAdminIds && room.coAdminIds.has(user.userId)) return true;

    const role = user.role.toLowerCase();
    return (
      role === 'admin' ||
      role === 'co-admin' ||
      role === 'mod' ||
      role === 'moderator' ||
      role === 'host'
    );
  }

  /**
   * Check if a user is the primary Admin of a specific room.
   */
  isAdmin(user, roomId = null) {
    if (!user) return false;
    const effectiveRoomId = roomId || this.socketToRoom.get(user.socketId);
    if (!effectiveRoomId) return false;

    const room = this.rooms.get(effectiveRoomId);
    if (!room) return false;

    return room.adminId === user.userId || room.hostId === user.userId;
  }

  /**
   * Determine a user's role strictly scoped to a specific room.
   * A user can be an Admin in Room A and a standard Viewer in Room B simultaneously.
   */
  getRoomScopedRole(roomId, userId, defaultRole = 'Participant') {
    const room = this.rooms.get(roomId);
    if (!room || !userId) return defaultRole;

    if (room.adminId === userId || room.hostId === userId) {
      return 'Admin';
    }

    if (room.coAdminIds && room.coAdminIds.has(userId)) {
      return 'Co-Admin';
    }

    return 'Participant';
  }

  /**
   * Get an existing room by roomId.
   */
  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  /**
   * Initialize or retrieve an active room in memory.
   */
  createOrGetRoom(roomId, adminId, initialVideoState = {}, autoJoin = false, coAdminIds = []) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        roomId,
        adminId,
        hostId: adminId, // backwards compatibility
        coAdminIds: new Set(Array.isArray(coAdminIds) ? coAdminIds : []),
        autoJoin: Boolean(autoJoin),
        videoState: {
          videoId: initialVideoState.videoId || '',
          url: initialVideoState.url || '',
          title: initialVideoState.title || '',
          currentTime: initialVideoState.currentTime || 0,
          isPlaying: initialVideoState.isPlaying || false,
          lastUpdated: Date.now(),
        },
        participants: new Map(),
        // Map<requestId, { requestId, socketId, userId, username, requestedAt }>
        pendingRequests: new Map(),
      });
    }
    return this.rooms.get(roomId);
  }

  /**
   * Add a user to a room with their room-scoped role.
   */
  addUser(roomId, userData) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Determine role strictly scoped to this specific room
    const scopedRole = this.getRoomScopedRole(roomId, userData.userId, userData.role || 'Participant');

    const user = {
      socketId: userData.socketId,
      userId: userData.userId,
      username: userData.username,
      role: scopedRole,
      joinedAt: new Date(),
    };

    room.participants.set(userData.socketId, user);
    this.socketToRoom.set(userData.socketId, roomId);
    return user;
  }

  /**
   * Assign or update a participant's role inside a specific room.
   */
  setParticipantRole(roomId, targetUserId, newRole) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    if (!room.coAdminIds) {
      room.coAdminIds = new Set();
    }

    if (newRole === 'Co-Admin') {
      room.coAdminIds.add(targetUserId);
    } else {
      room.coAdminIds.delete(targetUserId);
    }

    for (const p of room.participants.values()) {
      if (p.userId === targetUserId) {
        p.role = newRole;
      }
    }

    return room;
  }

  /**
   * Transfer room ownership (Admin) to another participant.
   */
  transferRoomAdmin(roomId, newAdminId, previousAdminId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.adminId = newAdminId;
    room.hostId = newAdminId;

    if (!room.coAdminIds) {
      room.coAdminIds = new Set();
    }

    room.coAdminIds.delete(newAdminId);
    if (previousAdminId) {
      room.coAdminIds.add(previousAdminId);
    }

    for (const p of room.participants.values()) {
      if (p.userId === newAdminId) {
        p.role = 'Admin';
      } else if (p.userId === previousAdminId) {
        p.role = 'Co-Admin';
      }
    }

    return room;
  }

  /**
   * Find a participant by socket ID.
   */
  getUser(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;
    const room = this.rooms.get(roomId);
    if (!room) return null;
    return room.participants.get(socketId);
  }

  /**
   * Remove a user by socket ID.
   */
  removeUser(socketId) {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    this.socketToRoom.delete(socketId);

    if (!room) return null;

    // Clean up from pending requests if this user was waiting
    for (const [reqId, req] of room.pendingRequests.entries()) {
      if (req.socketId === socketId) {
        room.pendingRequests.delete(reqId);
      }
    }

    const removedUser = room.participants.get(socketId);
    room.participants.delete(socketId);

    // If room is empty, clean up memory
    if (room.participants.size === 0 && room.pendingRequests.size === 0) {
      this.rooms.delete(roomId);
    }

    return { roomId, removedUser, remainingCount: room.participants.size };
  }

  /**
   * Get formatted list of active participants in a room.
   */
  getParticipants(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.participants.values());
  }

  /**
   * Find a participant in a room by their userId.
   */
  getParticipantByUserId(roomId, userId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    for (const participant of room.participants.values()) {
      if (participant.userId === userId) {
        return participant;
      }
    }
    return null;
  }

  /**
   * Update video state (time, play/pause, url, title).
   */
  updateVideoState(roomId, stateUpdate = {}) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.videoState = {
      ...room.videoState,
      ...stateUpdate,
      lastUpdated: Date.now(),
    };

    return room.videoState;
  }

  /**
   * Get current video state for a room.
   */
  getVideoState(roomId) {
    const room = this.rooms.get(roomId);
    return room ? room.videoState : null;
  }

  // ==========================================
  // Lobby / Waiting Room Management (Phase 3)
  // ==========================================

  /**
   * Check if Auto-Join is enabled for a room.
   */
  isAutoJoinEnabled(roomId) {
    const room = this.rooms.get(roomId);
    return Boolean(room?.autoJoin);
  }

  /**
   * Toggle or set Auto-Join state for a room.
   */
  setAutoJoin(roomId, enabled) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.autoJoin = Boolean(enabled);
      return room.autoJoin;
    }
    return false;
  }

  /**
   * Add a pending join request to the room lobby.
   */
  addPendingRequest(roomId, { requestId, socketId, userId, username }) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const request = {
      requestId,
      socketId,
      userId,
      username,
      requestedAt: Date.now(),
    };

    room.pendingRequests.set(requestId, request);
    return request;
  }

  /**
   * Remove a pending join request by requestId.
   */
  removePendingRequest(roomId, requestId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;
    const req = room.pendingRequests.get(requestId);
    room.pendingRequests.delete(requestId);
    return req;
  }

  /**
   * Get all pending join requests for a room.
   */
  getPendingRequests(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return Array.from(room.pendingRequests.values());
  }

  /**
   * Clear all pending requests (e.g. for Admit All).
   */
  clearPendingRequests(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    const all = Array.from(room.pendingRequests.values());
    room.pendingRequests.clear();
    return all;
  }

  /**
   * Terminate room and cleanup all socket-to-room mappings for that room.
   */
  terminateRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    for (const socketId of room.participants.keys()) {
      this.socketToRoom.delete(socketId);
    }
    for (const req of room.pendingRequests.values()) {
      this.socketToRoom.delete(req.socketId);
    }

    this.rooms.delete(roomId);
    return true;
  }
}

// Export singleton instance
module.exports = new RoomManager();

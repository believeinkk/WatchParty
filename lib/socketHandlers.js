const mongoose = require('mongoose');
const roomManager = require('./roomManager');
const Room = require('../models/Room');
const User = require('../models/User');

const isDbConnected = () => mongoose.connection.readyState === 1;

/**
 * Configure all WebSocket event listeners and RBAC on the Socket.io server.
 * Roles: Admin (Host), Co-Admin / Mod (Moderator), Participant (Viewer).
 * Includes Phase 3: Admin Lobby, Join Request Approval, Auto-Join Toggle, Admit All.
 * @param {import('socket.io').Server} io
 */
function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connection established: ${socket.id}`);

    /**
     * RBAC helper: Validate if user is Admin or Co-Admin (Mod).
     * Emits 'action_rejected' if unauthorized.
     */
    function verifyPlaybackPermission(actionName) {
      const user = roomManager.getUser(socket.id);
      if (!user) {
        socket.emit('action_rejected', {
          action: actionName,
          reason: 'Unauthorized: User is not in an active room.',
        });
        return null;
      }

      if (!roomManager.canControlPlayback(user)) {
        console.warn(`[RBAC] Access denied: '${user.username}' (${user.role}) attempted '${actionName}'`);
        socket.emit('action_rejected', {
          action: actionName,
          reason: `Access Denied: Only Admin or Co-Admin can perform '${actionName}'.`,
        });
        return null;
      }

      const roomId = roomManager.socketToRoom.get(socket.id);
      return { user, roomId };
    }

    /**
     * Helper to notify all Admins/Co-Admins in a room about pending join requests
     */
    function broadcastPendingRequestsToAdmins(roomId) {
      const room = roomManager.getRoom(roomId);
      if (!room) return;
      const requests = roomManager.getPendingRequests(roomId);

      for (const p of room.participants.values()) {
        if (roomManager.canControlPlayback(p)) {
          io.to(p.socketId).emit('pending_requests_list', requests);
        }
      }
    }

    /**
     * 1. JOIN ROOM & LOBBY SYSTEM (Phase 3)
     */
    socket.on('join_room', async ({ roomId, userId, username, bypassWaiting = false }) => {
      try {
        if (!roomId) {
          socket.emit('error_message', { message: 'roomId is required.' });
          return;
        }

        const cleanRoomId = roomId.trim();

        // Guest ID Generation for unauthenticated visitors
        const isGuestUser = !userId || userId.startsWith('guest_') || userId === 'guest';
        const cleanUserId = !isGuestUser && userId
          ? userId.trim()
          : `guest_${Math.floor(1000 + Math.random() * 9000)}`;

        const cleanUsername = username && username.trim()
          ? username.trim()
          : (isGuestUser ? `Guest ${cleanUserId.split('_')[1]}` : 'Viewer');

        // Check if room exists in MongoDB or memory
        const existingMemoryRoom = roomManager.getRoom(cleanRoomId);
        let roomDoc = null;

        if (isDbConnected()) {
          try {
            roomDoc = await Room.findOne({ roomId: cleanRoomId });
          } catch (dbErr) {
            console.warn('[Database] Room lookup fallback:', dbErr.message);
          }
        }

        const roomExists = Boolean(roomDoc || existingMemoryRoom);
        let assignedRole = 'Participant';

        if (!roomExists) {
          // Room does not exist: create it in MongoDB with role Admin
          assignedRole = isGuestUser ? 'Participant' : 'Admin';
          if (isDbConnected()) {
            try {
              roomDoc = await Room.create({
                roomId: cleanRoomId,
                adminId: cleanUserId,
                hostId: cleanUserId,
                autoJoin: false,
                currentVideoId: '',
                playState: false,
                currentTime: 0,
                currentVideo: {
                  url: '',
                  title: '',
                  playedSeconds: 0,
                  isPlaying: false,
                },
                status: 'active',
              });
              console.log(`[Database] Created new persistent room '${cleanRoomId}' with Admin '${cleanUsername}' (${cleanUserId})`);
            } catch (createErr) {
              console.warn('[Database] Room creation warning:', createErr.message);
            }
          }
        } else {
          // Room exists: if this user matches adminId or hostId, assign 'Admin'
          const adminId = roomDoc?.adminId || roomDoc?.hostId || existingMemoryRoom?.adminId || existingMemoryRoom?.hostId;
          const coAdminList = roomDoc?.coAdminIds || (existingMemoryRoom?.coAdminIds ? Array.from(existingMemoryRoom.coAdminIds) : []);
          if (adminId && adminId === cleanUserId && !isGuestUser) {
            assignedRole = 'Admin';
          } else if (coAdminList.includes(cleanUserId)) {
            assignedRole = 'Co-Admin';
          } else {
            assignedRole = 'Participant';
          }
        }

        // Initialize memory room if needed
        const restoredVideoId = roomDoc?.currentVideoId || '';
        const restoredUrl = roomDoc?.currentVideo?.url || (restoredVideoId ? `https://www.youtube.com/watch?v=${restoredVideoId}` : '');
        const restoredPlaying = roomDoc?.playState !== undefined ? roomDoc.playState : (roomDoc?.currentVideo?.isPlaying || false);
        const restoredTime = roomDoc?.currentTime !== undefined ? roomDoc.currentTime : (roomDoc?.currentVideo?.playedSeconds || 0);
        const restoredAutoJoin = roomDoc?.autoJoin !== undefined ? roomDoc.autoJoin : (existingMemoryRoom?.autoJoin || false);

        const initialVideoState = roomDoc
          ? {
              videoId: restoredVideoId,
              url: restoredUrl,
              title: roomDoc.currentVideo?.title || 'YouTube Stream',
              currentTime: restoredTime,
              isPlaying: restoredPlaying,
            }
          : {};

        const activeRoom = roomManager.createOrGetRoom(
          cleanRoomId,
          roomDoc?.adminId || roomDoc?.hostId || cleanUserId,
          initialVideoState,
          restoredAutoJoin,
          roomDoc?.coAdminIds || []
        );

        const isAdminUser = assignedRole === 'Admin';
        const isAutoJoinActive = Boolean(activeRoom.autoJoin);

        // ==========================================
        // Phase 3 Join Request & Waiting Room Check
        // ==========================================
        // If viewer is NOT the Admin, auto-join is OFF, and not explicitly bypassing via prior approval:
        if (roomExists && !isAdminUser && !isAutoJoinActive && !bypassWaiting) {
          const requestId = 'req_join_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

          roomManager.addPendingRequest(cleanRoomId, {
            requestId,
            socketId: socket.id,
            userId: cleanUserId,
            username: cleanUsername,
          });

          console.log(`[Lobby] Viewer '${cleanUsername}' (${cleanUserId}) placed in waiting room for '${cleanRoomId}'`);

          // 1. Notify the viewer they are in the waiting room
          socket.emit('waiting_approval', {
            requestId,
            roomId: cleanRoomId,
            userId: cleanUserId,
            username: cleanUsername,
            message: 'Waiting for Admin approval to enter the room...',
          });

          // 2. Notify room Admins of the new join request
          const requestPayload = {
            requestId,
            roomId: cleanRoomId,
            userId: cleanUserId,
            username: cleanUsername,
            requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          for (const p of activeRoom.participants.values()) {
            if (roomManager.canControlPlayback(p)) {
              io.to(p.socketId).emit('request_join', requestPayload);
            }
          }

          broadcastPendingRequestsToAdmins(cleanRoomId);
          return;
        }

        // ==========================================
        // Admitted / Auto-Joined / Admin Entry Flow
        // ==========================================

        // Upsert user in MongoDB if DB connected
        if (isDbConnected()) {
          try {
            await User.findOneAndUpdate(
              { userId: cleanUserId },
              { username: cleanUsername, role: assignedRole, roomId: cleanRoomId },
              { upsert: true, returnDocument: 'after' }
            );
          } catch (userErr) {
            console.warn('[Database] User record update warning:', userErr.message);
          }
        }

        // Add user to active memory room participants
        const joinedUser = roomManager.addUser(cleanRoomId, {
          socketId: socket.id,
          userId: cleanUserId,
          username: cleanUsername,
          role: assignedRole,
        });

        // Join socket room channel
        socket.join(cleanRoomId);

        console.log(`[Socket] ${cleanUsername} (${assignedRole}) joined room: ${cleanRoomId}`);

        const participants = roomManager.getParticipants(cleanRoomId);
        const currentVideoState = roomManager.getVideoState(cleanRoomId);
        const pendingList = isAdminUser ? roomManager.getPendingRequests(cleanRoomId) : [];

        // Acknowledge joined user with room context
        socket.emit('room_joined', {
          roomId: cleanRoomId,
          user: joinedUser,
          videoState: currentVideoState,
          participants,
          autoJoin: isAutoJoinActive,
          pendingRequests: pendingList,
        });

        // Broadcast to existing room participants
        socket.to(cleanRoomId).emit('user_joined', {
          user: joinedUser,
          participants,
        });

        io.to(cleanRoomId).emit('participant_list', participants);
      } catch (err) {
        console.error('[Socket] join_room error:', err);
        socket.emit('error_message', { message: 'Failed to join room.' });
      }
    });

    /**
     * Explicit request_join socket event
     */
    socket.on('request_join', ({ roomId, userId, username }) => {
      socket.emit('join_room', { roomId, userId, username, bypassWaiting: false });
    });

    /**
     * 2. JOIN DECISION (Phase 3: Admit or Reject a single viewer)
     */
    socket.on('join_decision', async ({ roomId, requestId, approved }) => {
      const auth = verifyPlaybackPermission('join_decision');
      if (!auth) return;

      const { user } = auth;
      const effectiveRoomId = roomId || auth.roomId;
      const room = roomManager.getRoom(effectiveRoomId);
      if (!room) return;

      const pendingRequest = roomManager.removePendingRequest(effectiveRoomId, requestId);
      if (!pendingRequest) {
        console.warn(`[Lobby] Pending request '${requestId}' not found or already decided.`);
        return;
      }

      const targetSocket = io.sockets.sockets.get(pendingRequest.socketId);

      if (approved) {
        console.log(`[Lobby] Admin '${user.username}' ADMITTED '${pendingRequest.username}' into '${effectiveRoomId}'`);

        // If target socket is still connected, admit them
        if (targetSocket) {
          targetSocket.emit('join_approved', {
            roomId: effectiveRoomId,
            message: 'You have been admitted by the Admin!',
          });

          // Automatically trigger active room join for the admitted user
          const joinedUser = roomManager.addUser(effectiveRoomId, {
            socketId: pendingRequest.socketId,
            userId: pendingRequest.userId,
            username: pendingRequest.username,
            role: 'Participant',
          });

          targetSocket.join(effectiveRoomId);

          const participants = roomManager.getParticipants(effectiveRoomId);
          const currentVideoState = roomManager.getVideoState(effectiveRoomId);

          targetSocket.emit('room_joined', {
            roomId: effectiveRoomId,
            user: joinedUser,
            videoState: currentVideoState,
            participants,
            autoJoin: roomManager.isAutoJoinEnabled(effectiveRoomId),
          });

          io.to(effectiveRoomId).emit('user_joined', {
            user: joinedUser,
            participants,
          });

          io.to(effectiveRoomId).emit('participant_list', participants);
        }
      } else {
        console.log(`[Lobby] Admin '${user.username}' REJECTED '${pendingRequest.username}' from '${effectiveRoomId}'`);

        if (targetSocket) {
          targetSocket.emit('join_rejected', {
            roomId: effectiveRoomId,
            reason: 'Access Denied by Admin. Your request to join the watch party was declined.',
          });
        }
      }

      broadcastPendingRequestsToAdmins(effectiveRoomId);
    });

    /**
     * 3. TOGGLE AUTO-JOIN (Phase 3)
     */
    socket.on('toggle_autojoin', async ({ roomId, enabled }) => {
      const auth = verifyPlaybackPermission('toggle_autojoin');
      if (!auth) return;

      const { user } = auth;
      const effectiveRoomId = roomId || auth.roomId;

      const newState = roomManager.setAutoJoin(effectiveRoomId, enabled);
      console.log(`[Lobby] Admin '${user.username}' toggled Auto-Join in '${effectiveRoomId}' to: ${newState}`);

      // Broadcast new auto-join state to all room participants
      io.to(effectiveRoomId).emit('autojoin_updated', {
        autoJoin: newState,
        updatedBy: user.username,
      });

      // Persist to MongoDB
      if (isDbConnected()) {
        try {
          await Room.updateOne({ roomId: effectiveRoomId }, { autoJoin: newState });
        } catch (dbErr) {
          console.warn('[Database] AutoJoin persistence warning:', dbErr.message);
        }
      }

      // If Auto-Join is turned ON, automatically admit any currently waiting users
      if (newState) {
        const waiting = roomManager.clearPendingRequests(effectiveRoomId);
        for (const req of waiting) {
          const targetSocket = io.sockets.sockets.get(req.socketId);
          if (targetSocket) {
            targetSocket.emit('join_approved', {
              roomId: effectiveRoomId,
              message: 'Auto-Join enabled! You have been admitted to the party.',
            });

            const joinedUser = roomManager.addUser(effectiveRoomId, {
              socketId: req.socketId,
              userId: req.userId,
              username: req.username,
              role: 'Participant',
            });

            targetSocket.join(effectiveRoomId);

            targetSocket.emit('room_joined', {
              roomId: effectiveRoomId,
              user: joinedUser,
              videoState: roomManager.getVideoState(effectiveRoomId),
              participants: roomManager.getParticipants(effectiveRoomId),
              autoJoin: true,
            });
          }
        }

        if (waiting.length > 0) {
          const updatedParticipants = roomManager.getParticipants(effectiveRoomId);
          io.to(effectiveRoomId).emit('participant_list', updatedParticipants);
        }

        broadcastPendingRequestsToAdmins(effectiveRoomId);
      }
    });

    /**
     * 4. ADMIT ALL (Phase 3: One-click approval of all pending requests)
     */
    socket.on('admit_all', async ({ roomId }) => {
      const auth = verifyPlaybackPermission('admit_all');
      if (!auth) return;

      const { user } = auth;
      const effectiveRoomId = roomId || auth.roomId;

      const pendingUsers = roomManager.clearPendingRequests(effectiveRoomId);
      if (pendingUsers.length === 0) return;

      console.log(`[Lobby] Admin '${user.username}' ADMITTED ALL (${pendingUsers.length} users) in '${effectiveRoomId}'`);

      for (const req of pendingUsers) {
        const targetSocket = io.sockets.sockets.get(req.socketId);
        if (targetSocket) {
          targetSocket.emit('join_approved', {
            roomId: effectiveRoomId,
            message: 'You have been admitted by the Admin!',
          });

          const joinedUser = roomManager.addUser(effectiveRoomId, {
            socketId: req.socketId,
            userId: req.userId,
            username: req.username,
            role: 'Participant',
          });

          targetSocket.join(effectiveRoomId);

          targetSocket.emit('room_joined', {
            roomId: effectiveRoomId,
            user: joinedUser,
            videoState: roomManager.getVideoState(effectiveRoomId),
            participants: roomManager.getParticipants(effectiveRoomId),
            autoJoin: roomManager.isAutoJoinEnabled(effectiveRoomId),
          });

          io.to(effectiveRoomId).emit('user_joined', {
            user: joinedUser,
            participants: roomManager.getParticipants(effectiveRoomId),
          });
        }
      }

      const updatedParticipants = roomManager.getParticipants(effectiveRoomId);
      io.to(effectiveRoomId).emit('participant_list', updatedParticipants);

      // System announcement in chat
      io.to(effectiveRoomId).emit('chat_message', {
        id: 'sys_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId: 'system',
        username: 'System',
        role: 'System',
        message: `${user.username} admitted all waiting viewers to the party!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      broadcastPendingRequestsToAdmins(effectiveRoomId);
    });

    /**
     * 5. LEAVE ROOM / DISCONNECT
     */
    const handleLeave = async (targetRoomId) => {
      const removedData = roomManager.removeUser(socket.id);
      if (!removedData) return;

      const { roomId, removedUser } = removedData;
      const effectiveRoomId = targetRoomId || roomId;

      socket.leave(effectiveRoomId);

      console.log(`[Socket] ${removedUser?.username || socket.id} left room: ${effectiveRoomId}`);

      const updatedParticipants = roomManager.getParticipants(effectiveRoomId);
      io.to(effectiveRoomId).emit('user_left', {
        socketId: socket.id,
        user: removedUser,
        participants: updatedParticipants,
      });
      io.to(effectiveRoomId).emit('participant_list', updatedParticipants);

      broadcastPendingRequestsToAdmins(effectiveRoomId);

      if (removedUser?.userId && isDbConnected()) {
        try {
          await User.updateOne({ userId: removedUser.userId }, { roomId: null });
        } catch (dbErr) {
          console.warn('[Database] User leave update warning:', dbErr.message);
        }
      }
    };

    socket.on('leave_room', ({ roomId }) => {
      handleLeave(roomId);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
      handleLeave();
    });

    /**
     * 6. SYNC STATE
     */
    socket.on('sync_state', (payload = {}) => {
      const user = roomManager.getUser(socket.id);
      const roomId = payload.roomId || (user ? roomManager.socketToRoom.get(socket.id) : null);
      if (!roomId) return;

      if (
        user &&
        roomManager.canControlPlayback(user) &&
        (payload.currentTime !== undefined || payload.isPlaying !== undefined)
      ) {
        roomManager.updateVideoState(roomId, {
          currentTime: payload.currentTime,
          isPlaying: payload.isPlaying,
        });
      }

      const currentState = roomManager.getVideoState(roomId);
      io.to(roomId).emit('sync_state', currentState);
    });

    /**
     * 7. PLAYBACK CONTROLS (RBAC: Admin or Co-Admin / Mod only)
     */

    // PLAY
    socket.on('play', async (payload = {}) => {
      const auth = verifyPlaybackPermission('play');
      if (!auth) return;

      const { user, roomId } = auth;
      const currentTime = typeof payload.currentTime === 'number' ? payload.currentTime : payload.time || 0;

      const updatedState = roomManager.updateVideoState(roomId, {
        isPlaying: true,
        currentTime,
      });

      console.log(`[Playback] 'play' in room '${roomId}' by ${user.username} (${user.role}) at ${currentTime}s`);

      io.to(roomId).emit('play', {
        currentTime,
        triggeredBy: user.username,
      });
      io.to(roomId).emit('sync_state', updatedState);

      if (isDbConnected()) {
        try {
          await Room.updateOne(
            { roomId },
            {
              playState: true,
              currentTime,
              'currentVideo.isPlaying': true,
              'currentVideo.playedSeconds': currentTime,
              status: 'active',
            }
          );
        } catch (err) {
          console.warn('[Database] Play update warning:', err.message);
        }
      }
    });

    // PAUSE
    socket.on('pause', async (payload = {}) => {
      const auth = verifyPlaybackPermission('pause');
      if (!auth) return;

      const { user, roomId } = auth;
      const currentTime = typeof payload.currentTime === 'number' ? payload.currentTime : payload.time || 0;

      const updatedState = roomManager.updateVideoState(roomId, {
        isPlaying: false,
        currentTime,
      });

      console.log(`[Playback] 'pause' in room '${roomId}' by ${user.username} (${user.role}) at ${currentTime}s`);

      io.to(roomId).emit('pause', {
        currentTime,
        triggeredBy: user.username,
      });
      io.to(roomId).emit('sync_state', updatedState);

      if (isDbConnected()) {
        try {
          await Room.updateOne(
            { roomId },
            {
              playState: false,
              currentTime,
              'currentVideo.isPlaying': false,
              'currentVideo.playedSeconds': currentTime,
              status: 'paused',
            }
          );
        } catch (err) {
          console.warn('[Database] Pause update warning:', err.message);
        }
      }
    });

    // SEEK
    socket.on('seek', async (payload = {}) => {
      const auth = verifyPlaybackPermission('seek');
      if (!auth) return;

      const { user, roomId } = auth;
      const seekTime = typeof payload.currentTime === 'number' ? payload.currentTime : payload.time || 0;

      const updatedState = roomManager.updateVideoState(roomId, {
        currentTime: seekTime,
      });

      console.log(`[Playback] 'seek' in room '${roomId}' to ${seekTime}s by ${user.username} (${user.role})`);

      io.to(roomId).emit('seek', {
        currentTime: seekTime,
        triggeredBy: user.username,
      });
      io.to(roomId).emit('sync_state', updatedState);

      if (isDbConnected()) {
        try {
          await Room.updateOne(
            { roomId },
            {
              currentTime: seekTime,
              'currentVideo.playedSeconds': seekTime,
            }
          );
        } catch (err) {
          console.warn('[Database] Seek update warning:', err.message);
        }
      }
    });

    // CHANGE VIDEO (Admin / Co-Admin only)
    socket.on('change_video', async (payload = {}) => {
      const auth = verifyPlaybackPermission('change_video');
      if (!auth) return;

      const { user, roomId } = auth;
      
      let videoId = payload.videoId;
      if (!videoId && payload.url) {
        const match = payload.url.match(
          /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
        );
        videoId = match ? match[1] : (payload.url.length === 11 ? payload.url : null);
      }

      if (!videoId) {
        socket.emit('error_message', { message: 'Valid YouTube Video ID or URL is required.' });
        return;
      }

      const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const title = payload.title || 'YouTube Video';

      const updatedState = roomManager.updateVideoState(roomId, {
        videoId,
        url: canonicalUrl,
        title,
        currentTime: 0,
        isPlaying: true,
      });

      console.log(`[Playback] 'change_video' in room '${roomId}' to videoId '${videoId}' by ${user.username} (${user.role})`);

      io.to(roomId).emit('change_video', {
        videoId,
        url: canonicalUrl,
        title,
        triggeredBy: user.username,
      });
      io.to(roomId).emit('sync_state', updatedState);

      if (isDbConnected()) {
        try {
          await Room.updateOne(
            { roomId },
            {
              currentVideoId: videoId,
              playState: true,
              currentTime: 0,
              'currentVideo.url': canonicalUrl,
              'currentVideo.title': title,
              'currentVideo.playedSeconds': 0,
              'currentVideo.isPlaying': true,
              status: 'active',
            }
          );
        } catch (err) {
          console.warn('[Database] Video change update warning:', err.message);
        }
      }
    });

    /**
     * ASSIGN ROLE
     */
    socket.on('assign_role', async ({ targetUserId, newRole }) => {
      const user = roomManager.getUser(socket.id);
      const isSenderAdmin = user && (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'host');
      if (!isSenderAdmin) {
        socket.emit('action_rejected', {
          action: 'assign_role',
          reason: 'Access Denied: Only the Admin can assign roles.',
        });
        return;
      }

      const roomId = roomManager.socketToRoom.get(socket.id);
      const room = roomManager.getRoom(roomId);
      if (!room) return;

      let normalizedRole = newRole;
      if (newRole.toLowerCase() === 'moderator' || newRole.toLowerCase() === 'co-admin' || newRole.toLowerCase() === 'mod') {
        normalizedRole = 'Co-Admin';
      } else {
        normalizedRole = 'Participant';
      }

      let targetParticipant = null;
      for (const p of room.participants.values()) {
        if (p.userId === targetUserId) {
          p.role = normalizedRole;
          targetParticipant = p;
          break;
        }
      }

      if (targetParticipant) {
        roomManager.setParticipantRole(roomId, targetUserId, normalizedRole);
        console.log(`[RBAC] Admin ${user.username} updated ${targetParticipant.username} role to '${normalizedRole}' in room '${roomId}'`);
        io.to(roomId).emit('participant_list', roomManager.getParticipants(roomId));
        io.to(roomId).emit('role_assigned', {
          userId: targetUserId,
          newRole: normalizedRole,
          updatedBy: user.username,
        });
        io.to(roomId).emit('role_updated', {
          userId: targetUserId,
          newRole: normalizedRole,
          updatedBy: user.username,
        });

        // Room-scoped persistence: Store coAdminIds on Room document only
        if (isDbConnected()) {
          try {
            await Room.updateOne(
              { roomId },
              normalizedRole === 'Co-Admin'
                ? { $addToSet: { coAdminIds: targetUserId } }
                : { $pull: { coAdminIds: targetUserId } }
            );
          } catch (dbErr) {
            console.warn('[Database] Room role persistence warning:', dbErr.message);
          }
        }
      }
    });

    /**
     * TRANSFER ADMIN / TRANSFER HOST
     */
    const handleTransferAdmin = async ({ targetUserId }) => {
      const user = roomManager.getUser(socket.id);
      const isSenderAdmin = user && (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'host');
      if (!isSenderAdmin) {
        socket.emit('action_rejected', {
          action: 'transfer_admin',
          reason: 'Access Denied: Only the current Admin can transfer the Admin role.',
        });
        return;
      }

      const roomId = roomManager.socketToRoom.get(socket.id);
      const room = roomManager.getRoom(roomId);
      if (!room || !targetUserId) return;

      const targetParticipant = roomManager.getParticipantByUserId(roomId, targetUserId);
      if (!targetParticipant || targetParticipant.userId === user.userId) {
        socket.emit('error_message', { message: 'Invalid target participant for Admin transfer.' });
        return;
      }

      targetParticipant.role = 'Admin';
      user.role = 'Co-Admin';
      roomManager.transferRoomAdmin(roomId, targetUserId, user.userId);

      console.log(`[Admin Transfer] In room '${roomId}', ${user.username} transferred Admin role to ${targetParticipant.username}`);

      io.to(roomId).emit('participant_list', roomManager.getParticipants(roomId));
      
      const transferPayload = {
        previousAdminId: user.userId,
        previousAdminName: user.username,
        newAdminId: targetUserId,
        newAdminName: targetParticipant.username,
        previousHostId: user.userId,
        previousHostName: user.username,
        newHostId: targetUserId,
        newHostName: targetParticipant.username,
      };

      io.to(roomId).emit('admin_transferred', transferPayload);
      io.to(roomId).emit('host_transferred', transferPayload);

      io.to(roomId).emit('role_updated', {
        userId: targetUserId,
        newRole: 'Admin',
        updatedBy: user.username,
      });
      io.to(roomId).emit('role_updated', {
        userId: user.userId,
        newRole: 'Co-Admin',
        updatedBy: user.username,
      });

      io.to(roomId).emit('chat_message', {
        id: 'sys_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId: 'system',
        username: 'System',
        role: 'System',
        message: `${user.username} transferred the Admin role to ${targetParticipant.username}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      // Room-scoped persistence: Update Room adminId/hostId and coAdminIds only
      if (isDbConnected()) {
        try {
          await Room.updateOne(
            { roomId },
            {
              adminId: targetUserId,
              hostId: targetUserId,
              $addToSet: { coAdminIds: user.userId },
              $pull: { coAdminIds: targetUserId },
            }
          );
        } catch (dbErr) {
          console.warn('[Database] Admin transfer DB update warning:', dbErr.message);
        }
      }
    };

    socket.on('transfer_admin', handleTransferAdmin);
    socket.on('transfer_host', handleTransferAdmin);

    /**
     * REMOVE PARTICIPANT (Kick)
     */
    socket.on('remove_participant', async ({ targetUserId }) => {
      const user = roomManager.getUser(socket.id);
      const isSenderAdmin = user && (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'host');
      if (!isSenderAdmin) {
        socket.emit('action_rejected', {
          action: 'remove_participant',
          reason: 'Access Denied: Only the Admin can remove participants.',
        });
        return;
      }

      if (user.userId === targetUserId) {
        socket.emit('error_message', { message: 'Admin cannot remove themselves from the room.' });
        return;
      }

      const roomId = roomManager.socketToRoom.get(socket.id);
      const target = roomManager.getParticipantByUserId(roomId, targetUserId);
      if (!target) return;

      console.log(
        `[RBAC] Admin '${user.username}' removed participant '${target.username}' (${target.userId}) from room '${roomId}'`
      );

      io.to(target.socketId).emit('kicked_from_room', {
        reason: 'You have been removed from the room by the Admin.',
      });

      const targetSocket = io.sockets.sockets.get(target.socketId);
      if (targetSocket) {
        targetSocket.leave(roomId);
      }

      roomManager.removeUser(target.socketId);

      io.to(roomId).emit('participant_removed', {
        targetUserId,
        username: target.username,
        removedBy: user.username,
      });
      io.to(roomId).emit('participant_list', roomManager.getParticipants(roomId));

      if (isDbConnected()) {
        try {
          await User.updateOne({ userId: targetUserId }, { roomId: null });
        } catch (dbErr) {
          console.warn('[Database] User kick update warning:', dbErr.message);
        }
      }
    });

    /**
     * REQUEST VIDEO CHANGE
     */
    socket.on('request_video_change', ({ roomId, url, title }) => {
      const user = roomManager.getUser(socket.id);
      const effectiveRoomId = roomId || (user ? roomManager.socketToRoom.get(socket.id) : null);
      if (!user || !effectiveRoomId || !url) return;

      const room = roomManager.getRoom(effectiveRoomId);
      if (!room) return;

      const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
      console.log(`[Request] '${user.username}' requested video '${url}' in room '${effectiveRoomId}'`);

      for (const p of room.participants.values()) {
        if (roomManager.canControlPlayback(p)) {
          io.to(p.socketId).emit('video_change_requested', {
            requestId,
            url,
            title: title || 'YouTube Video',
            requestedBy: user.username,
            requesterUserId: user.userId,
          });
        }
      }

      socket.emit('video_request_submitted', {
        message: 'Your video change request was sent to the Admin / Co-Admin.',
        url,
      });
    });

    /**
     * RESPOND TO VIDEO REQUEST
     */
    socket.on('respond_video_request', async ({ requestId, approved, videoId: incomingVideoId, url, title, requesterUserId }) => {
      const auth = verifyPlaybackPermission('respond_video_request');
      if (!auth) return;

      const { user, roomId } = auth;

      if (approved && (incomingVideoId || url)) {
        let videoId = incomingVideoId;
        if (!videoId && url) {
          const match = url.match(
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
          );
          videoId = match ? match[1] : (url.length === 11 ? url : null);
        }

        const canonicalUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
        const videoTitle = title || 'YouTube Stream';

        const updatedState = roomManager.updateVideoState(roomId, {
          videoId,
          url: canonicalUrl,
          title: videoTitle,
          currentTime: 0,
          isPlaying: true,
        });

        console.log(`[Request] Admin/Co-Admin '${user.username}' APPROVED video request '${videoId || canonicalUrl}'`);

        io.to(roomId).emit('change_video', {
          videoId,
          url: canonicalUrl,
          title: videoTitle,
          triggeredBy: user.username,
        });
        io.to(roomId).emit('sync_state', updatedState);
        io.to(roomId).emit('video_request_approved', {
          videoId,
          url: canonicalUrl,
          title: videoTitle,
          approvedBy: user.username,
          requesterUserId,
        });

        if (isDbConnected()) {
          try {
            await Room.updateOne(
              { roomId },
              {
                'currentVideo.url': canonicalUrl,
                'currentVideo.title': videoTitle,
                'currentVideo.playedSeconds': 0,
                'currentVideo.isPlaying': true,
              }
            );
          } catch (err) {
            console.warn('[Database] Approved video change update warning:', err.message);
          }
        }
      } else {
        console.log(`[Request] Admin/Co-Admin '${user.username}' REJECTED video request from user '${requesterUserId}'`);

        const target = roomManager.getParticipantByUserId(roomId, requesterUserId);
        if (target) {
          io.to(target.socketId).emit('video_request_rejected', {
            rejectedBy: user.username,
            reason: 'The admin or co-admin declined your video request.',
          });
        }
      }
    });

    /**
     * TEXT CHAT
     */
    socket.on('chat_message', (payload = {}) => {
      const user = roomManager.getUser(socket.id);
      const roomId = payload.roomId || (user ? roomManager.socketToRoom.get(socket.id) : null);
      if (!user || !roomId || !payload.message || typeof payload.message !== 'string') return;

      const cleanMessage = payload.message.trim();
      if (!cleanMessage) return;

      const messagePayload = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        userId: user.userId,
        username: user.username,
        role: user.role,
        message: cleanMessage.slice(0, 500),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      console.log(`[Chat] [${roomId}] ${user.username} (${user.role}): ${cleanMessage}`);
      io.to(roomId).emit('chat_message', messagePayload);
    });

    /**
     * REACTIONS
     */
    socket.on('send_reaction', (payload = {}) => {
      const user = roomManager.getUser(socket.id);
      const roomId = payload.roomId || (user ? roomManager.socketToRoom.get(socket.id) : null);
      if (!roomId || !payload.type) return;

      const reactionPayload = {
        id: 'react_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        type: payload.type,
        username: user?.username || 'Viewer',
        role: user?.role || 'Participant',
        randomX: Math.floor(Math.random() * 80) + 10,
      };

      console.log(`[Reaction] [${roomId}] ${reactionPayload.username} reacted with '${payload.type}'`);
      io.to(roomId).emit('receive_reaction', reactionPayload);
    });

    /**
     * END ROOM (Phase 7: Room Termination exclusively for Admin)
     */
    socket.on('end_room', async ({ roomId } = {}) => {
      const user = roomManager.getUser(socket.id);
      const effectiveRoomId = roomId || (user ? roomManager.socketToRoom.get(socket.id) : null);
      if (!effectiveRoomId) return;

      const room = roomManager.getRoom(effectiveRoomId);
      const isSenderAdmin =
        roomManager.isAdmin(user, effectiveRoomId) ||
        (user && (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'host')) ||
        (room && (room.adminId === user?.userId || room.hostId === user?.userId));

      if (!isSenderAdmin) {
        socket.emit('action_rejected', {
          action: 'end_room',
          reason: 'Access Denied: Only the Admin can terminate the room for all participants.',
        });
        return;
      }

      console.log(
        `[Room Terminated] Admin '${user?.username}' (${user?.userId}) ended room '${effectiveRoomId}' for all participants.`
      );

      // 1. Broadcast termination event to all clients in the room
      const terminationPayload = {
        roomId: effectiveRoomId,
        endedBy: user?.username || 'Admin',
        message: 'The Admin has ended the watch party for all participants.',
        timestamp: Date.now(),
      };

      io.to(effectiveRoomId).emit('room_terminated', terminationPayload);
      io.to(effectiveRoomId).emit('room_ended', terminationPayload);

      // 2. Delete the room from MongoDB database
      if (isDbConnected()) {
        try {
          await Room.deleteOne({ roomId: effectiveRoomId });
          await User.updateMany({ roomId: effectiveRoomId }, { roomId: null });
          console.log(`[Database] Room '${effectiveRoomId}' deleted from MongoDB.`);
        } catch (dbErr) {
          console.warn('[Database] Room deletion error:', dbErr.message);
        }
      }

      // 3. Disconnect/leave all sockets and purge in-memory room
      try {
        const roomSockets = await io.in(effectiveRoomId).fetchSockets();
        for (const s of roomSockets) {
          s.leave(effectiveRoomId);
        }
      } catch (sockErr) {
        console.warn('[Socket] Sockets leave error on end_room:', sockErr.message);
      }

      roomManager.terminateRoom(effectiveRoomId);
    });
  });
}

module.exports = setupSocketHandlers;

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tv,
  LogOut,
  Radio,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Crown,
  Shield,
  User,
  Film,
  Send,
  X,
  Check,
  Users,
  Clock,
  Sparkles,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  Power,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getSocket } from '@/lib/socket';
import { extractYouTubeID } from '@/lib/youtube';
import VideoPlayer from '@/components/VideoPlayer';
import Sidebar from '@/components/Sidebar';
import ShareLink from '@/components/ShareLink';
import WaitingRoom from '@/components/WaitingRoom';
import ThemeToggle from '@/components/ThemeToggle';
import PreJoinLobby from '@/components/PreJoinLobby';
import {
  AdminJoinToast,
  AutoJoinToggle,
  PendingRequestsModal,
} from '@/components/AdminLobbyControls';
import { FloatingReactions, ReactionPicker } from '@/components/FloatingReactions';
import RoomNavbar from '@/components/RoomNavbar';

function RoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const roomId = params?.roomId;

  // Pre-Join Lobby state (Google Meet style pre-join screen)
  const [isJoined, setIsJoined] = useState(false);

  // User state
  const [userId, setUserId] = useState('');
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('Participant');

  // Modular Layout state (Google Meet-style collapsible sidebar)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('chat'); // 'chat' | 'participants'
  const [isMobileParticipantsOpen, setIsMobileParticipantsOpen] = useState(false);

  // Phase 3: Lobby & Waiting Room State for Viewers
  const [lobbyStatus, setLobbyStatus] = useState('admitted'); // 'admitted' | 'waiting' | 'rejected'
  const [rejectionReason, setRejectionReason] = useState('');

  // Phase 3: Admin Lobby Controls State
  const [autoJoin, setAutoJoin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeJoinToast, setActiveJoinToast] = useState(null);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);

  // Phase 7: Room Termination Modal State (Admin only)
  const [isEndRoomModalOpen, setIsEndRoomModalOpen] = useState(false);

  // Room & Video state
  const [participants, setParticipants] = useState([]);
  const [videoState, setVideoState] = useState({
    url: '',
    title: '',
    currentTime: 0,
    isPlaying: false,
  });
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [notification, setNotification] = useState(null);

  // Live Chat and Reactions state
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);

  // Participant Request Video Modal & Approval state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestUrlInput, setRequestUrlInput] = useState('');
  const [pendingVideoRequest, setPendingVideoRequest] = useState(null);

  const socketRef = useRef(null);
  const userIdRef = useRef(userId);
  const usernameRef = useRef(username);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Initialize or load user identity from NextAuth session, localStorage, or query params
  useEffect(() => {
    let storedUserId = session?.user?.id || localStorage.getItem('watchparty_userId');
    let storedUsername =
      session?.user?.name || searchParams.get('username') || localStorage.getItem('watchparty_username');

    if (!storedUserId) {
      storedUserId = 'guest_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('watchparty_userId', storedUserId);
    }
    setUserId(storedUserId);

    if (storedUsername) {
      setUsername(storedUsername);
      localStorage.setItem('watchparty_username', storedUsername);
    } else {
      const defaultGuest = `Guest ${storedUserId.split('_')[1] || Math.floor(1000 + Math.random() * 9000)}`;
      setUsername(defaultGuest);
      localStorage.setItem('watchparty_username', defaultGuest);
    }
  }, [searchParams, session]);

  // Connect socket and join room once user joins from pre-join lobby
  useEffect(() => {
    if (!isJoined || !roomId || !userId || !username) return;

    const socket = getSocket();
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    // Join Room Event
    socket.emit('join_room', {
      roomId,
      userId,
      username,
    });

    // 1. Initial Room Context
    const onRoomJoined = (data) => {
      setLobbyStatus('admitted');
      const assignedRole = data?.user?.role || 'Participant';
      if (data?.user?.userId) {
        setUserId(data.user.userId);
        userIdRef.current = data.user.userId;
        try {
          localStorage.setItem('watchparty_userId', data.user.userId);
        } catch (e) {}
      }
      if (data?.user?.role) {
        setUserRole(data.user.role);
      }
      if (data?.videoState) {
        setVideoState(data.videoState);
      }
      if (data?.participants) {
        setParticipants(data.participants);
      }
      if (data?.autoJoin !== undefined) {
        setAutoJoin(data.autoJoin);
      }
      if (data?.pendingRequests) {
        setPendingRequests(data.pendingRequests);
      }

      // Phase 7: Persist active room in session memory for session recovery
      try {
        localStorage.setItem(
          'watchparty_active_room',
          JSON.stringify({
            roomId,
            role: assignedRole,
            username,
            videoTitle: data?.videoState?.title || 'YouTube Stream',
            status: 'active',
            lastActive: Date.now(),
          })
        );
      } catch (e) {
        console.warn('Failed to save active room session:', e);
      }

      showNotification(`Joined room as ${assignedRole}`, 'success');
    };

    // Phase 3: Viewer Waiting Approval Event
    const onWaitingApproval = () => {
      setLobbyStatus('waiting');
    };

    // Phase 3: Viewer Admitted Event
    const onJoinApproved = () => {
      setLobbyStatus('admitted');
      try {
        localStorage.setItem(
          'watchparty_active_room',
          JSON.stringify({
            roomId,
            role: 'Participant',
            username,
            videoTitle: videoState?.title || 'YouTube Stream',
            status: 'active',
            lastActive: Date.now(),
          })
        );
      } catch (e) {
        console.warn('Failed to save active room session:', e);
      }
      showNotification('Admitted by the Admin! Welcome to the watch party.', 'success');
    };

    // Phase 3: Viewer Rejected Event
    const onJoinRejected = (data) => {
      setLobbyStatus('rejected');
      setRejectionReason(data?.reason || 'Access Denied by Admin.');
    };

    // Phase 3: Admin Receives Join Request
    const onRequestJoin = (request) => {
      setActiveJoinToast(request);
      setPendingRequests((prev) => {
        if (prev.some((r) => r.requestId === request.requestId)) return prev;
        return [...prev, request];
      });
      setTimeout(() => {
        setActiveJoinToast((current) => (current?.requestId === request.requestId ? null : current));
      }, 12000);
    };

    // Phase 3: Admin Receives Updated Pending Requests List
    const onPendingRequestsList = (list) => {
      if (Array.isArray(list)) {
        setPendingRequests(list);
      }
    };

    // Phase 3: Auto-Join Setting Updated
    const onAutoJoinUpdated = ({ autoJoin: newAutoJoin, updatedBy }) => {
      setAutoJoin(newAutoJoin);
      showNotification(
        `Auto-Join ${newAutoJoin ? 'Enabled' : 'Disabled'} by ${updatedBy}`,
        newAutoJoin ? 'success' : 'info'
      );
    };

    // 2. User Joined Notification
    const onUserJoined = ({ user, participants: updatedList }) => {
      if (updatedList) setParticipants(updatedList);
      showNotification(`${user?.username || 'A viewer'} joined the party!`);
    };

    // 3. User Left Notification
    const onUserLeft = ({ user, participants: updatedList }) => {
      if (updatedList) setParticipants(updatedList);
      if (user?.username) {
        showNotification(`${user.username} left the room`);
      }
    };

    // 4. Participant List Update & Cross-verification of local role
    const onParticipantList = (list) => {
      if (Array.isArray(list)) {
        setParticipants(list);
        const currentSocketId = socket.id || socketRef.current?.id;
        const currentUid = userIdRef.current || userId;
        const currentUname = usernameRef.current || username;

        const me = list.find(
          (p) =>
            (p.userId && p.userId === currentUid) ||
            (p.socketId && p.socketId === currentSocketId) ||
            (p.username && p.username === currentUname)
        );

        if (me && me.role) {
          setUserRole(me.role);
          try {
            const raw = localStorage.getItem('watchparty_active_room');
            if (raw) {
              const parsed = JSON.parse(raw);
              localStorage.setItem(
                'watchparty_active_room',
                JSON.stringify({ ...parsed, role: me.role })
              );
            }
          } catch (e) {}
        }
      }
    };

    // 5. Video State Synchronization
    const onSyncState = (state) => {
      if (state) setVideoState(state);
    };

    // 6. Playback Play Event
    const onPlay = ({ currentTime, triggeredBy }) => {
      setVideoState((prev) => ({
        ...prev,
        isPlaying: true,
        currentTime: currentTime !== undefined ? currentTime : prev.currentTime,
      }));
      if (triggeredBy && triggeredBy !== username) {
        showNotification(`${triggeredBy} resumed playback`);
      }
    };

    // 7. Playback Pause Event
    const onPause = ({ currentTime, triggeredBy }) => {
      setVideoState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: currentTime !== undefined ? currentTime : prev.currentTime,
      }));
      if (triggeredBy && triggeredBy !== username) {
        showNotification(`${triggeredBy} paused playback`);
      }
    };

    // 8. Playback Seek Event
    const onSeek = ({ currentTime, triggeredBy }) => {
      setVideoState((prev) => ({
        ...prev,
        currentTime,
      }));
      if (triggeredBy && triggeredBy !== username) {
        showNotification(`${triggeredBy} skipped to ${Math.floor(currentTime)}s`);
      }
    };

    // 9. Video Changed Event
    const onVideoChanged = ({ videoId, url, title, triggeredBy }) => {
      const currentId = videoId || (url ? extractYouTubeID(url) : '');
      const canonicalUrl = currentId ? `https://www.youtube.com/watch?v=${currentId}` : url;
      setVideoState({
        videoId: currentId,
        url: canonicalUrl,
        title: title || 'YouTube Video',
        currentTime: 0,
        isPlaying: true,
      });

      try {
        const raw = localStorage.getItem('watchparty_active_room');
        if (raw) {
          const parsed = JSON.parse(raw);
          localStorage.setItem(
            'watchparty_active_room',
            JSON.stringify({ ...parsed, videoTitle: title || parsed.videoTitle })
          );
        }
      } catch (e) {}

      showNotification(`${triggeredBy} changed the video!`, 'info');
    };

    // 10. Role Updated (Promotion / Demotion)
    const onRoleUpdated = (payload) => {
      const targetId = payload?.userId || payload?.targetUserId;
      const targetSocketId = payload?.socketId;
      const targetUsername = payload?.username;
      const newRole = payload?.newRole || payload?.role;
      const updatedBy = payload?.updatedBy || 'Admin';

      const currentUid = userIdRef.current || userId;
      const currentUname = usernameRef.current || username;
      const currentSocketId = socket.id || socketRef.current?.id;

      const isMe =
        (targetId && targetId === currentUid) ||
        (targetSocketId && targetSocketId === currentSocketId) ||
        (targetUsername && targetUsername === currentUname);

      if (isMe && newRole) {
        console.log(`[Role Updated] Immediately updating local user role to '${newRole}'`);
        setUserRole(newRole);
        try {
          const raw = localStorage.getItem('watchparty_active_room');
          if (raw) {
            const parsed = JSON.parse(raw);
            localStorage.setItem(
              'watchparty_active_room',
              JSON.stringify({ ...parsed, role: newRole })
            );
          }
        } catch (e) {}
        showNotification(`Your role was updated to ${newRole} by ${updatedBy}!`, 'success');
      }
    };

    // 11. Kicked from Room
    const onKicked = ({ reason }) => {
      try {
        localStorage.removeItem('watchparty_active_room');
      } catch (e) {}
      alert(reason || 'You have been removed from the watch party by the Admin.');
      router.push('/');
    };

    // 12. Participant Removed Notification for Others
    const onParticipantRemoved = ({ username: removedName, removedBy }) => {
      showNotification(`${removedName} was removed from the party by ${removedBy}.`, 'info');
    };

    // 13. Action Rejected by Backend RBAC
    const onActionRejected = ({ reason }) => {
      showNotification(reason || 'Unauthorized action.', 'error');
    };

    // Phase 7: Room Terminated Event (Admin ended room for all)
    const onRoomTerminated = (termData) => {
      try {
        localStorage.removeItem('watchparty_active_room');
      } catch (e) {}
      showNotification(
        termData?.message || 'The Admin has ended the watch party for all participants.',
        'error'
      );
      setTimeout(() => {
        router.push('/?terminated=true');
      }, 1000);
    };

    // 14. Video Change Requested (Received by Admin and Co-Admins)
    const onVideoChangeRequested = (requestData) => {
      setPendingVideoRequest(requestData);
    };

    // 15. Video Request Approved Notification
    const onVideoRequestApproved = ({ requestedBy, title }) => {
      showNotification(`Video request approved: ${title || 'YouTube Stream'}`, 'success');
    };

    // 16. Video Request Rejected Notification
    const onVideoRequestRejected = ({ reason }) => {
      showNotification(reason || 'Your video request was declined.', 'error');
    };

    // 17. Text Chat Message
    const onChatMessage = (messageData) => {
      setMessages((prev) => [...prev, messageData]);
    };

    // 18. Live Reaction Received
    const onReceiveReaction = (reactionData) => {
      setReactions((prev) => [...prev, reactionData]);
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== reactionData.id));
      }, 2500);
    };

    // 19. Admin Transferred Notification
    const onAdminTransferred = ({
      previousAdminId,
      previousAdminName,
      newAdminId,
      newAdminName,
      previousHostId,
      previousHostName,
      newHostId,
      newHostName,
    }) => {
      const prevId = previousAdminId || previousHostId;
      const prevName = previousAdminName || previousHostName;
      const targetId = newAdminId || newHostId;
      const targetName = newAdminName || newHostName;

      const currentUid = userIdRef.current || userId;
      const currentUname = usernameRef.current || username;

      const isNewAdmin =
        (targetId && targetId === currentUid) ||
        (targetName && targetName === currentUname);

      const isPrevAdmin =
        (prevId && prevId === currentUid) ||
        (prevName && prevName === currentUname);

      if (isNewAdmin) {
        setUserRole('Admin');
        try {
          const raw = localStorage.getItem('watchparty_active_room');
          if (raw) {
            const parsed = JSON.parse(raw);
            localStorage.setItem(
              'watchparty_active_room',
              JSON.stringify({ ...parsed, role: 'Admin' })
            );
          }
        } catch (e) {}
        showNotification('You are now the Admin of the watch party!', 'success');
      } else if (isPrevAdmin) {
        setUserRole('Co-Admin');
        try {
          const raw = localStorage.getItem('watchparty_active_room');
          if (raw) {
            const parsed = JSON.parse(raw);
            localStorage.setItem(
              'watchparty_active_room',
              JSON.stringify({ ...parsed, role: 'Co-Admin' })
            );
          }
        } catch (e) {}
        showNotification(`You transferred the Admin role to ${targetName}.`, 'info');
      } else {
        showNotification(`${prevName} transferred the Admin role to ${targetName}.`, 'info');
      }
    };

    socket.on('room_joined', onRoomJoined);
    socket.on('waiting_approval', onWaitingApproval);
    socket.on('join_approved', onJoinApproved);
    socket.on('join_rejected', onJoinRejected);
    socket.on('request_join', onRequestJoin);
    socket.on('pending_requests_list', onPendingRequestsList);
    socket.on('autojoin_updated', onAutoJoinUpdated);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('participant_list', onParticipantList);
    socket.on('sync_state', onSyncState);
    socket.on('play', onPlay);
    socket.on('pause', onPause);
    socket.on('seek', onSeek);
    socket.on('change_video', onVideoChanged);
    socket.on('role_assigned', onRoleUpdated);
    socket.on('role_updated', onRoleUpdated);
    socket.on('kicked_from_room', onKicked);
    socket.on('participant_removed', onParticipantRemoved);
    socket.on('action_rejected', onActionRejected);
    socket.on('video_change_requested', onVideoChangeRequested);
    socket.on('video_request_approved', onVideoRequestApproved);
    socket.on('video_request_rejected', onVideoRequestRejected);
    socket.on('chat_message', onChatMessage);
    socket.on('receive_reaction', onReceiveReaction);
    socket.on('admin_transferred', onAdminTransferred);
    socket.on('host_transferred', onAdminTransferred);
    socket.on('room_terminated', onRoomTerminated);
    socket.on('room_ended', onRoomTerminated);

    return () => {
      socket.off('room_joined', onRoomJoined);
      socket.off('waiting_approval', onWaitingApproval);
      socket.off('join_approved', onJoinApproved);
      socket.off('join_rejected', onJoinRejected);
      socket.off('request_join', onRequestJoin);
      socket.off('pending_requests_list', onPendingRequestsList);
      socket.off('autojoin_updated', onAutoJoinUpdated);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('participant_list', onParticipantList);
      socket.off('sync_state', onSyncState);
      socket.off('play', onPlay);
      socket.off('pause', onPause);
      socket.off('seek', onSeek);
      socket.off('change_video', onVideoChanged);
      socket.off('role_assigned', onRoleUpdated);
      socket.off('role_updated', onRoleUpdated);
      socket.off('kicked_from_room', onKicked);
      socket.off('participant_removed', onParticipantRemoved);
      socket.off('action_rejected', onActionRejected);
      socket.off('video_change_requested', onVideoChangeRequested);
      socket.off('video_request_approved', onVideoRequestApproved);
      socket.off('video_request_rejected', onVideoRequestRejected);
      socket.off('chat_message', onChatMessage);
      socket.off('receive_reaction', onReceiveReaction);
      socket.off('admin_transferred', onAdminTransferred);
      socket.off('host_transferred', onAdminTransferred);
      socket.off('room_terminated', onRoomTerminated);
      socket.off('room_ended', onRoomTerminated);
    };
  }, [isJoined, roomId, userId, username, router]);

  // Authority & Role helpers
  const canControl = ['admin', 'co-admin', 'mod', 'host', 'moderator'].includes(userRole?.toLowerCase());
  const isAdminRole = ['admin', 'host'].includes(userRole?.toLowerCase());

  // Modular Sidebar Toggle (Google Meet style)
  const toggleSidebarTab = (tabName) => {
    if (isSidebarOpen && sidebarTab === tabName) {
      setIsSidebarOpen(false);
    } else {
      setSidebarTab(tabName);
      setIsSidebarOpen(true);
    }
  };

  const toggleSidebarOpen = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  // Phase 3: Admin Decision Handlers
  const handleAdmitViewer = (requestId) => {
    socketRef.current?.emit('join_decision', { roomId, requestId, approved: true });
    setActiveJoinToast((current) => (current?.requestId === requestId ? null : current));
  };

  const handleRejectViewer = (requestId) => {
    socketRef.current?.emit('join_decision', { roomId, requestId, approved: false });
    setActiveJoinToast((current) => (current?.requestId === requestId ? null : current));
  };

  const handleToggleAutoJoin = (enabled) => {
    socketRef.current?.emit('toggle_autojoin', { roomId, enabled });
  };

  const handleAdmitAll = () => {
    socketRef.current?.emit('admit_all', { roomId });
    setActiveJoinToast(null);
    showNotification('All waiting viewers admitted to the party!', 'success');
  };

  const handlePlay = (currentTime) => {
    socketRef.current?.emit('play', { roomId, currentTime });
  };

  const handlePause = (currentTime) => {
    socketRef.current?.emit('pause', { roomId, currentTime });
  };

  const handleSeek = (currentTime) => {
    socketRef.current?.emit('seek', { roomId, currentTime });
  };

  const handleSyncRequest = () => {
    socketRef.current?.emit('sync_state', { roomId });
    showNotification('Resyncing with room...', 'info');
  };

  const handleSendMessage = (text) => {
    socketRef.current?.emit('chat_message', { roomId, message: text });
  };

  const handleSendReaction = (type) => {
    socketRef.current?.emit('send_reaction', { roomId, type });
  };

  const handleTransferAdmin = (targetUserId) => {
    socketRef.current?.emit('transfer_admin', { roomId, targetUserId });
  };

  const handleChangeVideo = (e) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;
    if (!canControl) {
      showNotification('Only Admin or Co-Admin can change the video.', 'error');
      return;
    }

    const videoId = extractYouTubeID(newVideoUrl.trim());
    if (!videoId) {
      showNotification('Please enter a valid YouTube link or 11-digit Video ID.', 'error');
      return;
    }

    socketRef.current?.emit('change_video', {
      roomId,
      videoId,
      title: 'YouTube Stream',
    });

    setNewVideoUrl('');
  };

  const handleSubmitVideoRequest = (e) => {
    e.preventDefault();
    if (!requestUrlInput.trim()) return;

    const videoId = extractYouTubeID(requestUrlInput.trim());
    if (!videoId) {
      showNotification('Please enter a valid YouTube link or 11-digit Video ID.', 'error');
      return;
    }

    socketRef.current?.emit('request_video_change', {
      roomId,
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: 'Requested Video',
    });

    setRequestUrlInput('');
    setIsRequestModalOpen(false);
    showNotification('Video request submitted to Admin!', 'success');
  };

  const handleRespondToRequest = (approved) => {
    if (!pendingVideoRequest) return;

    const videoId =
      pendingVideoRequest.videoId ||
      (pendingVideoRequest.url ? extractYouTubeID(pendingVideoRequest.url) : null);

    socketRef.current?.emit('respond_video_request', {
      requestId: pendingVideoRequest.requestId,
      approved,
      videoId,
      url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : pendingVideoRequest.url,
      title: pendingVideoRequest.title,
      requesterUserId: pendingVideoRequest.requesterUserId,
    });

    setPendingVideoRequest(null);
  };

  const handleAssignRole = (targetUserId, newRole) => {
    socketRef.current?.emit('assign_role', { targetUserId, newRole });
  };

  const handleRemoveParticipant = (targetUserId) => {
    if (confirm('Are you sure you want to remove this participant from the room?')) {
      socketRef.current?.emit('remove_participant', { targetUserId });
    }
  };

  const handleLeaveRoom = () => {
    socketRef.current?.emit('leave_room', { roomId, userId });
    try {
      localStorage.removeItem('watchparty_active_room');
    } catch (e) {}
    setIsJoined(false);
    router.push('/');
  };

  const handleEndRoom = () => {
    socketRef.current?.emit('end_room', { roomId });
    try {
      localStorage.removeItem('watchparty_active_room');
    } catch (e) {}
    setIsEndRoomModalOpen(false);
    setIsJoined(false);
    showNotification('Terminating watch party for all participants...', 'info');
    setTimeout(() => {
      router.push('/?terminated=true');
    }, 800);
  };

  // Pre-Join Lobby Join Handler
  const handleJoinFromLobby = (chosenName) => {
    const finalName = chosenName?.trim() || username || 'Guest';
    setUsername(finalName);
    try {
      localStorage.setItem('watchparty_username', finalName);
    } catch (e) {}
    setIsJoined(true);
  };

  // Google Meet Style Pre-Join Lobby Screen
  if (!isJoined) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="pre-join-lobby-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.3 }}
        >
          <PreJoinLobby
            roomId={roomId}
            initialUsername={username}
            session={session}
            onJoin={handleJoinFromLobby}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Phase 3 Viewer Waiting / Rejected Screen View
  if (lobbyStatus === 'waiting' || lobbyStatus === 'rejected') {
    return (
      <WaitingRoom
        roomId={roomId}
        username={username}
        status={lobbyStatus}
        rejectionReason={rejectionReason}
        onReturnHome={() => {
          setIsJoined(false);
          router.push('/');
        }}
      />
    );
  }

  // Sidebar Framer Motion animation variants
  const sidebarVariants = {
    open: {
      width: 320,
      opacity: 1,
      x: 0,
      transition: { type: 'spring', damping: 25, stiffness: 220 },
    },
    closed: {
      width: 0,
      opacity: 0,
      x: 30,
      transition: { duration: 0.25, ease: 'easeInOut' },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl backdrop-blur-xl border flex items-center gap-2 ${
              notification.type === 'error'
                ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
                : notification.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            ) : notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Radio className="w-4 h-4 text-zinc-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 3 Admin Floating Join Request Toast */}
      {canControl && (
        <AdminJoinToast
          request={activeJoinToast}
          onAdmit={handleAdmitViewer}
          onReject={handleRejectViewer}
        />
      )}

      {/* Phase 3 Admin Lobby Pending Requests Modal */}
      {canControl && (
        <PendingRequestsModal
          isOpen={isPendingModalOpen}
          onClose={() => setIsPendingModalOpen(false)}
          pendingRequests={pendingRequests}
          onAdmit={handleAdmitViewer}
          onReject={handleRejectViewer}
          onAdmitAll={handleAdmitAll}
        />
      )}

      {/* Admin / Co-Admin Video Change Request Approval Banner */}
      <AnimatePresence>
        {pendingVideoRequest && canControl && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-white dark:bg-zinc-900 border border-amber-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Film className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">
                    Video Request from {pendingVideoRequest.requestedBy}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-xs font-mono">
                  {pendingVideoRequest.url}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleRespondToRequest(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                  title="Approve Request"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
                <button
                  onClick={() => handleRespondToRequest(false)}
                  className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  title="Reject Request"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participant Request Video Modal */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-red-500" />
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Request a Video
                  </h3>
                </div>
                <button
                  onClick={() => setIsRequestModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Paste a YouTube link to request playback. The Admin or Co-Admin will receive your
                request for approval.
              </p>
              <form onSubmit={handleSubmitVideoRequest} className="space-y-4">
                <input
                  type="text"
                  value={requestUrlInput}
                  onChange={(e) => setRequestUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Request</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Phase 7: End Room for All Confirmation Modal (Admin only) */}
      <AnimatePresence>
        {isEndRoomModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-600 shrink-0">
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    End Room for All Participants?
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    This will permanently terminate the watch party.
                  </p>
                </div>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 leading-relaxed">
                All connected participants will be immediately redirected to the Home page, the room will be deleted from the database, and active session memory will be wiped.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEndRoomModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="confirm-end-room-btn"
                  type="button"
                  onClick={handleEndRoom}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>End Room for All</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modular Top Room Navbar — Professional Management & Multi-Device Responsive */}
      <RoomNavbar
        roomId={roomId}
        username={username}
        userId={userId}
        userRole={userRole}
        canControl={canControl}
        isAdminRole={isAdminRole}
        videoState={videoState}
        autoJoin={autoJoin}
        pendingRequests={pendingRequests}
        messages={messages}
        participants={participants}
        isSidebarOpen={isSidebarOpen}
        sidebarTab={sidebarTab}
        toggleSidebarTab={toggleSidebarTab}
        toggleSidebarOpen={toggleSidebarOpen}
        onToggleAutoJoin={handleToggleAutoJoin}
        onOpenPendingModal={() => setIsPendingModalOpen(true)}
        onOpenEndRoomModal={() => setIsEndRoomModalOpen(true)}
        onOpenRequestModal={() => setIsRequestModalOpen(true)}
        onChangeVideo={handleChangeVideo}
        newVideoUrl={newVideoUrl}
        setNewVideoUrl={setNewVideoUrl}
        onSyncRequest={handleSyncRequest}
        onLeaveRoom={handleLeaveRoom}
        showNotification={showNotification}
      />

      {/* Main Room Layout — Responsive across Mobile, Tablet, Laptop, and Widescreen */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col lg:flex-row overflow-hidden relative pb-16 lg:pb-0">
        {/* Main Video & Controls Section */}
        <motion.main
          layout
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="flex-1 p-2 sm:p-4 lg:p-6 flex flex-col justify-center min-w-0 transition-all overflow-y-auto"
        >
          {/* Synchronized Player with Floating Reactions Overlay */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-zinc-200/50 dark:border-zinc-800/60">
            <VideoPlayer
              videoState={videoState}
              canControl={canControl}
              userRole={userRole}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeek={handleSeek}
              onSyncRequest={handleSyncRequest}
            />
            <FloatingReactions reactions={reactions} />
          </div>

          {/* Video Metadata & Modular Control Bar */}
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-zinc-900/60 backdrop-blur-md border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                <Tv className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-200 truncate">
                  {videoState.title || (videoState.url ? 'YouTube Stream' : 'No video selected')}
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-md">
                  {videoState.url || 'Waiting for the Admin to load a YouTube video link.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {/* Mobile-only Participants Toggle Button */}
              <button
                type="button"
                onClick={() => setIsMobileParticipantsOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 text-xs font-semibold border border-zinc-200 dark:border-zinc-700/80 transition-colors shadow-xs cursor-pointer active:scale-95"
                title="Manage Participants"
              >
                <Users className="w-3.5 h-3.5 text-red-500" />
                <span>People ({participants.length})</span>
              </button>

              <ReactionPicker onSendReaction={handleSendReaction} />

              {/* Theater / Fullscreen Width Toggle (Desktop) */}
              <button
                type="button"
                onClick={toggleSidebarOpen}
                className="hidden lg:flex px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                title={
                  isSidebarOpen
                    ? 'Full Width Video Mode (Hide Sidebar)'
                    : 'Show Chat & People Sidebar'
                }
              >
                {isSidebarOpen ? (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Theater</span>
                  </>
                ) : (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-red-500" />
                    <span>Normal</span>
                  </>
                )}
              </button>

              <span
                className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                  videoState.isPlaying
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/50'
                }`}
              >
                {videoState.isPlaying ? 'Playing' : 'Paused'}
              </span>
            </div>
          </div>
        </motion.main>

        {/* Desktop Sidebar (Screens >= lg): Animated Collapsible Panel */}
        <div className="hidden lg:block h-full shrink-0">
          <AnimatePresence initial={false}>
            {isSidebarOpen && (
              <motion.div
                key="room-sidebar-desktop"
                variants={sidebarVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="overflow-hidden h-full shrink-0 border-l border-zinc-200 dark:border-zinc-800/80"
              >
                <Sidebar
                  roomId={roomId}
                  participants={participants}
                  currentUserId={userId}
                  currentUserRole={userRole}
                  onAssignRole={handleAssignRole}
                  onRemoveParticipant={handleRemoveParticipant}
                  onTransferHost={handleTransferAdmin}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                  activeTab={sidebarTab}
                  onTabChange={(tab) => setSidebarTab(tab)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile / Tablet Slide-over Sidebar Drawer (Screens < lg) */}
        <AnimatePresence>
          {isSidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Dimmed Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Slide-over Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 260 }}
                className="absolute top-0 right-0 bottom-0 w-full sm:w-96 max-w-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col z-10"
              >
                <Sidebar
                  roomId={roomId}
                  participants={participants}
                  currentUserId={userId}
                  currentUserRole={userRole}
                  onAssignRole={handleAssignRole}
                  onRemoveParticipant={handleRemoveParticipant}
                  onTransferHost={handleTransferAdmin}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isOpen={true}
                  onClose={() => setIsSidebarOpen(false)}
                  activeTab={sidebarTab}
                  onTabChange={(tab) => setSidebarTab(tab)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Desktop Google Meet-Style Floating Restore Pill (Visible when sidebar is closed on desktop) */}
        {!isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="hidden lg:flex fixed bottom-6 right-6 z-40 items-center gap-2 p-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 shadow-2xl backdrop-blur-xl"
          >
            <button
              onClick={() => toggleSidebarTab('chat')}
              className="p-2.5 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30 hover:bg-red-500 transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
              title="Open Chat"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
              {messages.length > 0 && (
                <span className="text-[10px] bg-black/30 px-1.5 py-0.2 rounded-full">
                  {messages.length}
                </span>
              )}
            </button>

            <button
              onClick={() => toggleSidebarTab('participants')}
              className="p-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
              title="Open Participants"
            >
              <Users className="w-4 h-4" />
              <span>({participants.length})</span>
            </button>

            <button
              onClick={toggleSidebarOpen}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Expand Sidebar"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Mobile Bottom Navigation Dock (Screens < lg) */}
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-200/80 dark:border-zinc-800/70 px-4 py-2 flex items-center justify-around shadow-lg">
          <button
            type="button"
            onClick={() => {
              if (isSidebarOpen) setIsSidebarOpen(false);
            }}
            className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              !isSidebarOpen
                ? 'text-red-600 dark:text-red-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="text-[10px]">Video</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSidebarTab('chat')}
            className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isSidebarOpen && sidebarTab === 'chat'
                ? 'text-red-600 dark:text-red-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[10px]">Chat</span>
            {messages.length > 0 && (
              <span className="absolute top-0 right-2 px-1 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold">
                {messages.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileParticipantsOpen(true)}
            className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              isMobileParticipantsOpen
                ? 'text-red-600 dark:text-red-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="text-[10px]">People</span>
            <span className="absolute top-0 right-1 px-1 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[9px] font-mono">
              {participants.length}
            </span>
          </button>

          <div className="flex items-center">
            <ReactionPicker onSendReaction={handleSendReaction} />
          </div>
        </div>

        {/* Mobile Responsive Bottom Sheet for Participants (High z-index z-50 overlay) */}
        <AnimatePresence>
          {isMobileParticipantsOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
              {/* Dimmed Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileParticipantsOpen(false)}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              />

              {/* Slide-Up Bottom Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Drag Handle */}
                <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700 mx-auto mt-3 mb-1" />

                {/* Sheet Header */}
                <div className="px-5 py-3 border-b border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>Room Participants</span>
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono font-bold text-zinc-600 dark:text-zinc-400">
                          {participants.length}
                        </span>
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        {isAdminRole ? 'Tap 3-dots to assign roles or remove viewers' : 'Live viewers in this room'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMobileParticipantsOpen(false)}
                    className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Sheet Content: Full Participant List with Touch Role Dropdown */}
                <div className="flex-1 overflow-y-auto pb-8 pt-2">
                  <ParticipantList
                    participants={participants}
                    currentUserId={userId}
                    currentUserRole={userRole}
                    onAssignRole={handleAssignRole}
                    onRemoveParticipant={handleRemoveParticipant}
                    onTransferHost={handleTransferAdmin}
                  />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function RoomPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center text-zinc-500">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs uppercase tracking-wider font-medium">
            Entering Party Room...
          </span>
        </div>
      }
    >
      <RoomContent />
    </Suspense>
  );
}

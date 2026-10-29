const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    adminId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    // Retained for backwards-compatibility
    hostId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    // Array of userIds granted Co-Admin privileges specifically in this room
    coAdminIds: {
      type: [String],
      default: [],
    },
    currentVideoId: {
      type: String,
      default: '',
      trim: true,
    },
    playState: {
      type: Boolean,
      default: false,
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    currentVideo: {
      url: {
        type: String,
        default: '',
      },
      title: {
        type: String,
        default: '',
      },
      playedSeconds: {
        type: Number,
        default: 0,
      },
      isPlaying: {
        type: Boolean,
        default: false,
      },
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'ended'],
      default: 'active',
    },
    autoJoin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Room || mongoose.model('Room', RoomSchema);

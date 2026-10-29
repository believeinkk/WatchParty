import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import User from '@/models/User';

const BACKUP_FILE = path.join(process.cwd(), 'data', 'users.json');

function getFallbackMap() {
  if (global.__inMemoryUsers) return global.__inMemoryUsers;
  global.__inMemoryUsers = new Map();

  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const u of list) {
          if (u && u.userId) {
            global.__inMemoryUsers.set(u.userId.toLowerCase(), u);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[UserRepo] Fallback file read warning:', err.message);
  }

  return global.__inMemoryUsers;
}

function persistFallback() {
  try {
    const dir = path.dirname(BACKUP_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const users = Array.from(getFallbackMap().values());
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.warn('[UserRepo] Fallback file write warning:', err.message);
  }
}

export async function findUserByIdentifier(identifier) {
  if (!identifier) return null;
  await connectDB();
  const clean = identifier.trim().toLowerCase();

  if (mongoose.connection.readyState === 1) {
    try {
      const dbUser = await User.findOne({
        $or: [
          { userId: clean },
          { email: clean },
          { username: new RegExp(`^${identifier.trim()}$`, 'i') },
        ],
      });
      if (dbUser) return dbUser;
    } catch (err) {
      console.warn('[UserRepo] MongoDB query warning:', err.message);
    }
  }

  const map = getFallbackMap();
  for (const user of map.values()) {
    if (
      user.userId.toLowerCase() === clean ||
      user.email.toLowerCase() === clean ||
      user.username.toLowerCase() === clean
    ) {
      return user;
    }
  }
  return null;
}

export async function findUserByUserId(userId) {
  if (!userId) return null;
  await connectDB();
  const clean = userId.trim().toLowerCase();

  if (mongoose.connection.readyState === 1) {
    try {
      const dbUser = await User.findOne({ userId: clean });
      if (dbUser) return dbUser;
    } catch (err) {
      console.warn('[UserRepo] MongoDB query warning:', err.message);
    }
  }

  const map = getFallbackMap();
  return map.get(clean) || null;
}

export async function findUserByEmail(email) {
  if (!email) return null;
  await connectDB();
  const clean = email.trim().toLowerCase();

  if (mongoose.connection.readyState === 1) {
    try {
      const dbUser = await User.findOne({ email: clean });
      if (dbUser) return dbUser;
    } catch (err) {
      console.warn('[UserRepo] MongoDB query warning:', err.message);
    }
  }

  const map = getFallbackMap();
  for (const user of map.values()) {
    if (user.email.toLowerCase() === clean) {
      return user;
    }
  }
  return null;
}

export async function findUserByCredentialsVerification(userId, username) {
  if (!userId || !username) return null;
  await connectDB();
  const cleanId = userId.trim().toLowerCase();
  const cleanName = username.trim().toLowerCase();

  if (mongoose.connection.readyState === 1) {
    try {
      const dbUser = await User.findOne({
        userId: cleanId,
        username: new RegExp(`^${username.trim()}$`, 'i'),
      });
      if (dbUser) return dbUser;
    } catch (err) {
      console.warn('[UserRepo] MongoDB query warning:', err.message);
    }
  }

  const map = getFallbackMap();
  for (const user of map.values()) {
    if (
      user.userId.toLowerCase() === cleanId &&
      user.username.toLowerCase() === cleanName
    ) {
      return user;
    }
  }
  return null;
}

export async function createUserRecord({ userId, username, email, password, role = 'Admin' }) {
  await connectDB();
  const cleanId = userId.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = username.trim();

  let createdUser = null;

  if (mongoose.connection.readyState === 1) {
    try {
      createdUser = await User.create({
        userId: cleanId,
        username: cleanName,
        email: cleanEmail,
        password,
        role,
      });
    } catch (err) {
      console.warn('[UserRepo] MongoDB creation warning:', err.message);
    }
  }

  const record = createdUser
    ? createdUser.toObject()
    : {
        userId: cleanId,
        username: cleanName,
        email: cleanEmail,
        password,
        role,
        createdAt: new Date().toISOString(),
      };

  const map = getFallbackMap();
  map.set(cleanId, record);
  persistFallback();

  return record;
}

export async function updateUserPassword(userId, hashedPassword) {
  await connectDB();
  const cleanId = userId.trim().toLowerCase();

  if (mongoose.connection.readyState === 1) {
    try {
      await User.updateOne({ userId: cleanId }, { password: hashedPassword });
    } catch (err) {
      console.warn('[UserRepo] MongoDB update warning:', err.message);
    }
  }

  const map = getFallbackMap();
  const existing = map.get(cleanId);
  if (existing) {
    existing.password = hashedPassword;
    map.set(cleanId, existing);
    persistFallback();
  }

  return true;
}

import jwt from 'jsonwebtoken';
import { initDB } from './database.js';

/**
 * Authenticate request from Authorization header.
 * Returns { user } on success, { error, status } on failure.
 */
export async function authenticate(request) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { error: 'Access token required', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const { User } = await initDB();

    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user || !user.isActive) {
      return { error: 'User not found or inactive', status: 403 };
    }

    return { user };
  } catch {
    return { error: 'Invalid or expired token', status: 403 };
  }
}

/**
 * Authenticate AND check role(s).
 * Returns { user } on success, { error, status } on failure.
 */
export async function authenticateAndAuthorize(request, allowedRoles) {
  const result = await authenticate(request);
  if (result.error) return result;

  if (!allowedRoles.includes(result.user.role)) {
    return {
      error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      status: 403,
    };
  }

  return result;
}

export function generateToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

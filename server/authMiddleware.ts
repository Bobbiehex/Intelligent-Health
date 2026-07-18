import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string | null;
}

// Extend Express Request interface to include the user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT access tokens.
 * Reads token from Authorization header (Bearer <token>).
 */
export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token && req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access token missing. Authentication required.' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('❌ [Auth Middleware] Environmental Configuration Error: JWT_SECRET environment variable is missing.');
      return res.status(500).json({ error: 'Internal Server Error: Missing server configuration.' });
    }

    let decoded: AuthenticatedUser;
    try {
      decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
    } catch (jwtError: any) {
      if (jwtError.name !== 'TokenExpiredError') {
        console.warn(`⚠️ [Auth Middleware] JWT Verification Failed: ${jwtError.message} (Name: ${jwtError.name})`);
      }
      return res.status(403).json({ error: 'Invalid or expired access token.' });
    }
    
    // Check database to ensure user is active
    let dbUser;
    try {
      dbUser = await prisma.user.findUnique({ where: { id: decoded.id } });
    } catch (dbError: any) {
      console.error('❌ [Auth Middleware] Database Connection/Query Error:', dbError);
      return res.status(500).json({ 
        error: 'Internal Server Error: Database query failed.',
        details: process.env.NODE_ENV === 'development' || process.env.VERCEL ? dbError.message : undefined
      });
    }

    if (!dbUser) {
      console.warn(`⚠️ [Auth Middleware] User lookup failed: User ID ${decoded.id} not found in database.`);
      return res.status(403).json({ error: 'User does not exist in clinic records.' });
    }
    if (!dbUser.isActive) {
      console.warn(`⚠️ [Auth Middleware] Account inactive: User ID ${decoded.id} is deactivated.`);
      return res.status(403).json({ error: 'This account has been deactivated. Please contact the administrator.' });
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    console.error('❌ [Auth Middleware] Unexpected Error in Auth Middleware:', error);
    return res.status(500).json({ error: 'Internal Server Error: Unexpected error in authentication.' });
  }
}

/**
 * Middleware to enforce specific user role permissions.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. Authenticated session required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access Denied. Forbidden for role: ${req.user.role}. This resource is restricted to: [${allowedRoles.join(', ')}]` 
      });
    }

    next();
  };
}

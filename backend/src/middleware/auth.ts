import type { NextFunction, Request, Response } from 'express';
import * as jose from 'jose';
import { config } from '../config/env.js';

function getJwksUrl() {
  return `${config.neonAuthUrl.replace(/\/$/, '')}/.well-known/jwks.json`;
}

// Create a remote JWKS set that handles caching automatically
const jwks = jose.createRemoteJWKSet(new URL(getJwksUrl()));

async function verifyToken(token: string): Promise<jose.JWTPayload> {
  const { payload } = await jose.jwtVerify(token, jwks, {
    algorithms: ['RS256', 'ES256', 'EdDSA'],
  });

  return payload;
}

function getBearerToken(authorization?: string | string[]) {
  const header = Array.isArray(authorization) ? authorization[0] : authorization;
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      res.status(401).json({ error: 'Missing authorization token' });
      return;
    }

    const payload = await verifyToken(token);
    if (!payload.sub) {
      res.status(401).json({ error: 'Invalid token subject' });
      return;
    }

    req.user = {
      id: payload.sub,
      email: (payload as { email?: string }).email ?? '',
    };

    next();
  } catch (error) {
    console.error('Authentication failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

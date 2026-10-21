import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'mck-beyond-youth-secret-key-change-in-production';
const encodedSecret = new TextEncoder().encode(JWT_SECRET);

export interface AdminPayload extends JWTPayload {
  id: string;
  email: string;
  name?: string;
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedSecret);
}

export async function verifyToken<T = AdminPayload>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload as unknown as T;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(pass: string): Promise<string> {
  return await bcrypt.hash(pass, 10);
}

export async function comparePassword(pass: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(pass, hash);
}

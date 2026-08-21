import jwt from 'jsonwebtoken';
import { IProfile } from '../models/Profile';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

export function generateToken(user: IProfile): string {
  const payload: TokenPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret') as TokenPayload;
}

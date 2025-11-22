import {JwtPayload} from 'jsonwebtoken';

export type Role = 'TechHead' | 'President' | 'cabinet' | 'Member';

export interface UserPayload extends JwtPayload {
  id: string;
  email: string;
  role: Role;
  isVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

export {};

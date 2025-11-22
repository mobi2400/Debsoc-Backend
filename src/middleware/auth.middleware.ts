import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import {type NextFunction, type Request, type Response} from 'express';

dotenv.config();

// Define roles matching the Prisma models
export type Role = 'TechHead' | 'President' | 'cabinet' | 'Member';

// Interface for the decoded JWT payload
interface UserPayload extends jwt.JwtPayload {
  id: string;
  email: string;
  role: Role;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({message: 'Unauthorized: No token provided'});
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({message: 'Unauthorized: No token provided'});
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as UserPayload;

    // Attach the user to the request object
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({message: 'Unauthorized: Invalid token'});
  }
};

export const authorizeRoles = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({message: 'Unauthorized: User not found'});
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return res.status(403).json({
        message: `Forbidden: You do not have access to this resource. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

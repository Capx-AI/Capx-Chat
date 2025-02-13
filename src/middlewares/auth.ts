import { z } from "zod";
import { NextFunction, Request, Response } from "express";

// Export validation schema for reuse
export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional()
});

// Export middleware for external use
export const validateAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    authSchema.parse(req.body);
    next();
  } catch (error) {
    next();
  }
};

export const validateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = req.supabaseClient;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = {
      id: user.id,
      email: user.email || "",
      first_name: user.user_metadata.first_name,
      last_name: user.user_metadata.last_name,
      username: user.user_metadata.username
    }
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Authentication failed' });
  }
};
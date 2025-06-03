import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
interface AuthRequest extends Request {
  user?: any; // Define the user type as needed
}
export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  const verify = jwt.verify(token, "JWT_SECRET");
  if (!verify) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.user = verify;
  next();
}

import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: any;
}
interface decodedI extends JwtPayload {
  userId: string | JwtPayload;
}
export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  console.log("is it getting invoked !!!");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized - No token" });
    return;
  }

  const token = authHeader.split(" ")[1];
  console.log("token from the header is: ", token);

  try {
    const decoded = jwt.verify(token, "JWT_SECRET") as decodedI;
    req.user = decoded?.userId;
    console.log(req.user)
    next();
  } catch (error) {
    res.json({ error: "Unauthorized - Invalid token",status:401 });
  }
}

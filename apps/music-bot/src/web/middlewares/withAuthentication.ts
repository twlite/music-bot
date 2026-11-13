import {
  validateSession,
  cookieToken,
  authorizeAction,
} from "@/player/session";
import { NextFunction, Request, Response } from "express";

export async function withAuthentication(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = cookieToken(req.headers.cookie);

  if (!token)
    return res.status(401).json({
      error: "Missing authorization token",
    });

  const user = await validateSession(token);

  if (!user || !(await authorizeAction(user)))
    return res.status(401).json({
      error: "Invalid authorization token",
    });

  // @ts-ignore
  req.user = user;

  next();
}

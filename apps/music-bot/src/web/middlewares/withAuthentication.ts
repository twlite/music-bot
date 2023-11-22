import { validateSession } from '#bot/player/session';
import { NextFunction, Request, Response } from 'express';

export async function withAuthentication(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token)
    return res.status(401).json({
      error: 'Missing authorization token',
    });

  const user = await validateSession(token);

  if (!user)
    return res.status(401).json({
      error: 'Invalid authorization token',
    });

  // @ts-ignore
  req.user = user;

  next();
}

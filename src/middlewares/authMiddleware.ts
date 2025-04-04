import { Request, Response, NextFunction } from "express";

export function ensureAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.isAuthenticated()) {
    return next(); // User is logged in, allow access
  }
  res.redirect("/login"); // Redirect to login page
}

import { Request, Response } from "express";
import bcrypt from "bcrypt";
import passport from "passport";
import pool from "../config/db";

import IUser from "../models/user";

export function getLogin(req: Request, res: Response) {
  res.render("login", { title: "Login", error: req.query.error || null });
}

export const postLogin = passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login?error=invalid_credentials",
});

export function getSignup(req: Request, res: Response) {
  res.render("signup", { title: "Sign Up", error: req.query.error || null });
}

export async function postSignup(req: Request, res: Response) {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.redirect("/auth/signup?error=missing_fields");

  try {
    const [existingUsers] = await pool.query<IUser[]>(
      "SELECT * FROM users WHERE email = ?",
      [email],
    );
    if (existingUsers.length > 0)
      return res.redirect("/auth/signup?error=email_exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hashedPassword],
    );
    res.redirect("/auth/login");
  } catch (err) {
    console.log(err);
    res.redirect("/auth/signup?error=server_error");
  }
}

export function logout(req: Request, res: Response) {
  req.logout(() => res.redirect("/"));
}

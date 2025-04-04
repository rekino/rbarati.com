import passport from "passport";
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import bcrypt from "bcrypt";
import pool from "./db";

import IUser from '../models/user';
import { ResultSetHeader } from "mysql2/promise";

// Local Strategy (Email & Password)
passport.use(
  new LocalStrategy(
    { 
      usernameField: "email",
      passwordField: "password"
    },
    async (email: string, password: string, done: Function) => {
      try {
        const [users] = await pool.query<IUser[]>(
          "SELECT * FROM users WHERE email = ?",
          [email],
        );
        if (users.length === 0)
          return done(null, false, { message: "User not found" });
    
        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return done(null, false, { message: "Incorrect password" });
    
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: Function) => {
      try {
        const [users] = await pool.query<IUser[]>(
          "SELECT * FROM users WHERE google_id = ?",
          [profile.id],
        );
        let user;
        if (users.length > 0)
          user = {
            id: users[0].id,
            name: users[0].name,
            email: users[0].email,
          };
          return done(null, user);

        const [result] = await pool.query<ResultSetHeader>(
          "INSERT INTO users (name, email, google_id) VALUES (?, ?, ?)",
          [profile.displayName, profile.emails?.[0].value, profile.id],
        );
        const newUser = {
          id: result.insertId,
          name: profile.displayName,
          email: profile.emails?.[0].value,
        };
        return done(null, newUser);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  const [users] = await pool.query<IUser[]>("SELECT * FROM users WHERE id = ?", [id]);
  let user;
  if (users.length > 0)
    user = {
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
    };
  done(null, user);
});

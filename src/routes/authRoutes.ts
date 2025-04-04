import express from "express";
import passport from "passport";
import {
  getLogin,
  postLogin,
  getSignup,
  postSignup,
  logout,
} from "../controllers/authController";

const router = express.Router();

router.get("/login", getLogin);
router.post("/login", postLogin);

router.get("/signup", getSignup);
router.post("/signup", postSignup);

router.get("/logout", logout);

// Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login",
  }),
);

export default router;

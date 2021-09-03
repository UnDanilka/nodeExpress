const { Router } = require("express");
const router = Router();
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const sendgrid = require("nodemailer-sendgrid-transport");
const keys = require("../keys");
const regEmail = require("../emails/registration");
const resetEmail = require("../emails/reset");
const { validationResult } = require("express-validator");
const { registerValidators } = require("../utils/validators");

const transporter = nodemailer.createTransport(
  sendgrid({
    auth: { api_key: keys.SENDGRID_API_KEY },
  })
);

router.get("/login", async (req, res) => {
  res.render("auth/login", {
    title: "authorisation",
    isLogin: true,
    loginError: req.flash("loginError"),
    registerError: req.flash("registerError"),
  });
});

router.get("/logout", async (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login#login");
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const candidate = await User.findOne({ email });

    if (candidate) {
      const areSame = await bcrypt.compare(password, candidate.password);
      if (areSame) {
        const user = candidate;
        req.session.user = user;
        req.session.isAuthenticated = true;
        req.session.save((err) => {
          if (err) {
            throw err;
          }
          res.redirect("/");
        });
      } else {
        req.flash("loginError", "Incorrect password");

        res.redirect("/auth/login#login");
      }
    } else {
      req.flash("loginError", "User is not exist");
      res.redirect("/auth/login#login");
    }
  } catch (e) {
    console.log(e);
  }
});

router.post("/register", registerValidators, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("registerError", errors.array()[0].msg);
      return res.status(422).redirect("/auth/login#register");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      name,
      password: hashPassword,
      cart: { items: [] },
    });

    await user.save();

    await transporter.sendMail(regEmail(email));
    res.redirect("/auth/login#login");
  } catch (e) {
    console.log(e);
  }
});

router.get("/reset", (req, res) => {
  res.render("auth/reset", {
    title: "Reset",
    error: req.flash("error"),
  });
});

router.get("/password/:token", async (req, res) => {
  if (!req.params.token) {
    return res.redirect("/auth/login");
  }

  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExp: { $gt: Date.now() },
    });

    if (!user) {
      return res.redirect("/auth/login");
    } else {
      res.render("auth/password", {
        title: "Get access",
        error: req.flash("error"),
        userId: user._id.toString(),
        token: req.params.token,
      });
    }
  } catch (e) {
    console.log(e);
  }
});

router.post("/reset", (req, res) => {
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        req.flash("error", "Something goes wrong");
        return res.redirect("/auth/reset");
      }

      const token = buffer.toString("hex");

      const candidate = await User.findOne({ email: req.body.email });

      if (candidate) {
        candidate.resetToken = token;
        candidate.resetTokenExp = Date.now() + 60 * 60 * 1000;
        await candidate.save();
        await transporter.sendMail(resetEmail(candidate.email, token));
        res.redirect("/auth/login");
      } else {
        req.flash("error", "Email is not found");
        res.redirect("/auth/reset");
      }
    });
  } catch (e) {
    console.log(e);
  }

  return console.log("hi");
});

router.post("/password", async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.body.userId,
      resetToken: req.body.token,
      resetTokenExp: { $gt: Date.now() },
    });

    if (user) {
      user.password = await bcrypt.hash(req.body.password, 10);
      user.resetToken = undefined;
      user.resetTokenExp = undefined;
      res.redirect("/auth/login");
    } else {
      req.flash("loginError", "Old Token");
      res.redirect("/auth/login");
    }
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;

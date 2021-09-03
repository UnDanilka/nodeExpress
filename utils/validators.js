const { body } = require("express-validator");
const User = require("../models/user");

exports.registerValidators = [
  body("email")
    .isEmail()
    .withMessage("Enter correct email")
    .custom(async (value, { req }) => {
      try {
        const user = await User.findOne({ email: value });
        if (user) {
          return Promise.reject("Email exists");
        }
      } catch (e) {
        console.log(eval);
      }
    })
    .normalizeEmail(),
  body("password", "incorrect password")
    .isLength({ min: 6, max: 56 })
    .isAlphanumeric()
    .trim(),
  body("confirm")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Passwords is not matched");
      }
      return true;
    })
    .trim(),
  body("name", "Name should contain minimum 3 symbols")
    .isLength({ min: 3 })
    .trim(),
];

exports.courseValidators = [
  body("title")
    .isLength({ min: 3 })
    .withMessage("Min size is 3 symbols")
    .trim(),
  body("price").isNumeric().withMessage("enter correct price"),
  body("img", "enter correct url").isURL(),
];

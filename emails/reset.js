const keys = require("../keys");

module.exports = (email, token) => {
  return {
    to: email,
    from: keys.EMAIL_FROM,
    subject: "Reset password",
    html: `
            <h1>Forgot password?</h1>
            <p>If no ignore it</p>
            <p>If yes tap the link</p>
            <p><a href='${keys.BASE_URL}/auth/password/${token}'>Get access</a></p>
            <hr/>
            <a href=${keys.BASE_URL}>Courses shop</a>
            `,
  };
};

const keys = require("../keys");

module.exports = (email) => {
  return {
    to: email,
    from: keys.EMAIL_FROM,
    subject: "Registration complited",
    html: `
        <h1>Welcome to our shop</h1>
        <p>Account has been created with email - ${email}</p>
        <hr/>
        <a href=${keys.BASE_URL}>Courses shop</a>
        `,
  };
};

const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const homeRoutes = require("./routes/home");
const addRoutes = require("./routes/add");
const ordersRoutes = require("./routes/orders");
const coursesRoutes = require("./routes/courses");
const session = require("express-session");
const csrf = require("csurf");
const helmet = require("helmet");
const flash = require("connect-flash");
const authRoutes = require("./routes/auth");
const cardRoutes = require("./routes/card");
const varMiddleware = require("./middleware/variables");
const MongoStore = require("connect-mongodb-session")(session);
const userMiddleware = require("./middleware/user");
const keys = require("./keys/index");
const errorHandler = require("./middleware/error");
const profileRoutes = require("./routes/profile");
const compression = require("compression");
const fileMiddleware = require("./middleware/file");

const PORT = process.env.PORT || 4000;

const start = async () => {
  try {
    await mongoose.connect(keys.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
    });

    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  } catch (e) {
    console.log(e);
  }
};

start();

const store = new MongoStore({
  collection: "sessions",
  uri: keys.MONGODB_URI,
});

const hbs = exphbs.create({
  defaultLayout: "main",
  extname: "hbs",
  helpers: require("./utils/hbs-helpers"),
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
});

app.engine("hbs", hbs.engine);

app.set("view engine", "hbs");
app.set("views", "views");

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(helmet());
app.use(compression());

app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  session({
    secret: keys.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
  })
);

app.use(fileMiddleware.single("avatar"));
app.use(csrf());
app.use(flash());

app.use(varMiddleware);
app.use(userMiddleware);

app.use("/", homeRoutes);
app.use("/add", addRoutes);
app.use("/courses", coursesRoutes);
app.use("/card", cardRoutes);
app.use("/orders", ordersRoutes);
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use(errorHandler);

const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const app = express();
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const morgan = require("morgan");
const session = require("express-session");
const path = require("path"); 

const Listing = require("./models/listings.js");
const authController = require("./controllers/auth.js");
const listingsController = require("./controllers/listings.js");
const usersController = require("./controllers/users");

const port = process.env.PORT ? process.env.PORT : "3000";

app.use(expressLayouts);
app.set("view engine", "ejs");
app.set("views", "./views");

// Move these middleware declarations here
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/auth/sign-in");
  }
};

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on("connected", () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.get("/", (req, res) => {
  res.render("index.ejs", {
    user: req.session.user,
  });
});

app.get('/listings/browse', async (req, res) => {
  try {
    const listings = await Listing.find().populate('user', 'username');
    res.render('partials/browse-listings', { listings, layout: false });
  } catch (error) {
    res.status(500).send('Error fetching listings');
  }
});

app.get('/users/my-listings', isLoggedIn, async (req, res) => {
  try {
    const listings = await Listing.find({ user: req.session.user._id });
    res.render('partials/my-listings', { listings, layout: false });
  } catch (error) {
    res.status(500).send('Error fetching listings');
  }
});

app.use("/auth", authController);
app.use("/listings", listingsController);
app.use("/users", usersController);

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});

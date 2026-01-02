// if (process.env.NODE_ENV !== "production") {
//     require("dotenv").config();
// }
require("dotenv").config();
console.log("DEBUG: SECRET value is:", process.env.SECRET);
console.log("DEBUG: SECRET type is:", typeof process.env.SECRET);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");

const ExpressError = require("./utils/ExpressError.js");
const User = require("./models/user.js");

// Routes
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const categoryRoutes = require("./routes/category.js");

// =====================
// ENV VALIDATION
// =====================
const dbUrl = process.env.ATLASDB_URL;
const sessionSecret = process.env.SECRET;

if (!dbUrl) {
    throw new Error("ATLASDB_URL is missing in environment variables");
}

if (!sessionSecret) {
    throw new Error("SECRET is missing in environment variables");
}

// =====================
// APP CONFIG
// =====================
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

// =====================
// START SERVER (ASYNC SAFE)
async function startServer() {
    try {
        // 1. Connect to Atlas first
        await mongoose.connect(dbUrl);
        console.log("Connected to MongoDB Atlas");

        // 2. Configure Store with an immediate string fallback
        // This prevents the 'null (reading length)' error during the internal tick
        const store = MongoStore.create({
            mongoUrl: dbUrl,
            crypto: {
                secret: process.env.SECRET || "nopasswordprovided", 
            },
            touchAfter: 24 * 3600,
        });

        store.on("error", (err) => {
            console.error("Mongo session store error:", err);
        });

        // 3. Session Middleware
        app.use(
            session({
                store: store,
                secret: process.env.SECRET || "nopasswordprovided",
                resave: false,
                saveUninitialized: false,
                cookie: {
                    httpOnly: true,
                    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                },
            })
        );

        app.use(flash());

        // ... (Passport and Routes go here) ...

        app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// This middleware makes 'currUser' available in ALL EJS files
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user; // This is what isOwner and isReviewAuthor use!
    next();
});

        app.all("*path", (req, res) => {
            res.redirect("/listings");
        });

        app.listen(8080, () => {
            console.log("Server running on port 8080");
        });

    } catch (err) {
        console.error("Startup error:", err);
        process.exit(1);
    }
}

startServer();
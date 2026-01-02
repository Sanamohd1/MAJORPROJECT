if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

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
const SESSION_SECRET = process.env.SECRET || "dev-secret-change-this-in-production";

if (!dbUrl) {
    throw new Error("ATLASDB_URL is missing in environment variables");
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
// =====================
async function startServer() {
    try {
        // 1. Connect to MongoDB first
        await mongoose.connect(dbUrl);
        console.log(" Connected to MongoDB Atlas");

        // 2. Create MongoStore AFTER connection is established
        const store = MongoStore.create({
            mongoUrl: dbUrl,
            touchAfter: 24 * 3600, // 24 hours
            collectionName: 'sessions' // explicit collection name
        });

        store.on("error", (err) => {
            console.error("Mongo session store error:", err);
        });

        // 3. Session Middleware
        app.set("trust proxy", 1);

        const sessionConfig = {
            store: store,
            name: 'session', // change default session cookie name
            secret: SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
                secure: process.env.NODE_ENV === "production", // true in production
                sameSite: "lax",
            },
        };

        app.use(session(sessionConfig));
        app.use(flash());

        // 4. Passport Configuration
        app.use(passport.initialize());
        app.use(passport.session());
        passport.use(new LocalStrategy(User.authenticate()));
        passport.serializeUser(User.serializeUser());
        passport.deserializeUser(User.deserializeUser());

        // 5. Flash Messages Middleware
        app.use((req, res, next) => {
            res.locals.currUser = req.user;
            res.locals.success = req.flash("success");
            res.locals.error = req.flash("error");
            next();
        });

        // 6. Routes
        app.use("/listings", listingRouter);
        app.use("/listings/:id/reviews", reviewRouter);
        app.use("/", userRouter);
        app.use("/:category", categoryRoutes);

        // 7. Home Route
        app.get("/", (req, res) => {
            res.redirect("/listings");
        });

        // 8. Catch-all Route
        app.all("*path", (req, res, next) => {
            next(new ExpressError(404, "Page Not Found!"));
        });

        // 9. Error Handler
        app.use((err, req, res, next) => {
            let { statusCode = 500, message = "Something went wrong!" } = err;
            res.status(statusCode).render("error.ejs", { message });
        });

        // 10. Start Server
        app.listen(8080, () => {
            console.log("Server running on http://localhost:8080");
        });

    } catch (err) {
        console.error(" Startup error:", err);
        process.exit(1);
    }
}

startServer();
const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const { listingSchema, reviewSchema } = require("./schema");

/* ================= AUTH ================= */

/**
 * Require user to be logged in
 */
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    // save intended URL (but avoid saving login page itself)
    if (req.originalUrl !== "/login") {
      req.session.redirectUrl = req.originalUrl;
    }

    req.flash("error", "You must be logged in first");
    return res.redirect("/login");
  }

  next();
};

/**
 * Make redirect URL available after login
 */
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
    delete req.session.redirectUrl; // prevent stale redirects
  }
  next();
};

/* ================= LISTING ================= */

/**
 * Verify listing owner
 */
module.exports.isOwner = async (req, res, next) => {
  const { id } = req.params;

  const listing = await Listing.findById(id);
  if (!listing) {
    throw new ExpressError(404, "Listing not found");
  }

  if (!req.user || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

/**
 * Validate listing data
 */
module.exports.validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);

  if (error) {
    const message = error.details.map(d => d.message).join(", ");
    throw new ExpressError(400, message);
  }

  next();
};

/* ================= REVIEW ================= */

/**
 * Validate review data
 */
module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);

  if (error) {
    const message = error.details.map(d => d.message).join(", ");
    throw new ExpressError(400, message);
  }

  next();
};

/**
 * Verify review author
 */
module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ExpressError(404, "Review not found");
  }

  if (!req.user || !review.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that");
    return res.redirect(`/listings/${id}`);
  }

  next();
};

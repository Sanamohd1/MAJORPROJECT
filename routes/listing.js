const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");


const listingController = require("../controllers/listings");

const multer = require("multer");
const { storage } = require("../cloudConfig");
const upload = multer({ storage });
const { isLoggedIn, isOwner, validateListing } = require("../middleware");

/* =========================
   INDEX + CREATE ROUTES
========================= */
router
  .route("/")
  .get(wrapAsync(listingController.index))
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  );

/* =========================
   NEW FORM ROUTE
========================= */
router.get("/new", isLoggedIn, listingController.renderNewForm);

/* =========================
   CATEGORY ROUTE
   
========================= */
router.get("/category/:type", wrapAsync(listingController.filterListings));

/* =========================
   SHOW + UPDATE + DELETE ROUTES
   
========================= */
router
  .route("/:id")
  .get(wrapAsync(listingController.showListing))
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  )
  .delete(
    isLoggedIn,
    isOwner,
    wrapAsync(listingController.destroyListing)
  );

/* =========================
   EDIT FORM ROUTE
========================= */
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;
const Listing = require("../models/listing");

/* ============================
   1. INDEX ROUTE
============================ */
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    return res.render("listings/index.ejs", { allListings });
};

/* ============================
   2. NEW FORM
============================ */
module.exports.renderNewForm = (req, res) => {
    return res.render("listings/new.ejs");
};

/* ============================
   3. SHOW ROUTE
============================ */
module.exports.showListing = async (req, res) => {
    try {
        const { id } = req.params;

        const listing = await Listing.findById(id)
            .populate({ path: "reviews", populate: { path: "author" } })
            .populate("owner");

        if (!listing) {
            req.flash("error", "Listing you are requesting doesn't exist");
            return res.redirect("/listings");
        }

        let originalImageUrl = "";
        if (listing.image && listing.image.url) {
            originalImageUrl = listing.image.url.replace(
                "/upload",
                "/upload/w_250"
            );
        }

        return res.render("listings/show.ejs", {
            listing,
            originalImageUrl,
        });
    } catch (err) {
        console.error(err);
        req.flash("error", "Something went wrong");
        return res.redirect("/listings");
    }
};

/* ============================
   4. CREATE ROUTE
============================ */
module.exports.createListing = async (req, res) => {
    try {
        if (!req.file) {
            req.flash("error", "Image upload required");
            return res.redirect("/listings/new");
        }

        const { path: url, filename } = req.file;

        const newListing = new Listing(req.body.listing);
        newListing.owner = req.user._id;
        newListing.image = { url, filename };

        await newListing.save();

        req.flash("success", "New Listing Created!");
        return res.redirect("/listings");
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to create listing");
        return res.redirect("/listings");
    }
};

/* ============================
   5. EDIT FORM
============================ */
module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;

    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you are requesting doesn't exist");
        return res.redirect("/listings");
    }

    let originalImageUrl = "";
    if (listing.image && listing.image.url) {
        originalImageUrl = listing.image.url.replace(
            "/upload",
            "/upload/w_250"
        );
    }

    return res.render("listings/edit.ejs", {
        listing,
        originalImageUrl,
    });
};

/* ============================
   6. UPDATE ROUTE
============================ */
module.exports.updateListing = async (req, res) => {
    try {
        const { id } = req.params;

        let listing = await Listing.findByIdAndUpdate(
            id,
            { ...req.body.listing },
            { new: true }
        );

        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/listings");
        }

        if (req.file) {
            const { path: url, filename } = req.file;
            listing.image = { url, filename };
            await listing.save();
        }

        req.flash("success", "Listing Updated!");
        return res.redirect(`/listings/${id}`);
    } catch (err) {
        console.error(err);
        req.flash("error", "Failed to update listing");
        return res.redirect("/listings");
    }
};

/* ============================
   7. DELETE ROUTE
============================ */
module.exports.destroyListing = async (req, res) => {
    const { id } = req.params;

    await Listing.findByIdAndDelete(id);

    req.flash("success", "Listing Deleted!");
    return res.redirect("/listings");
};

/* ============================
   8. CATEGORY FILTER
============================ */
module.exports.filterListings = async (req, res) => {
    try {
        const { type } = req.params;

        const images = await Image.find({ category: type });

        console.log(images); // debug

        res.render("listings/category.ejs", { images });
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
};
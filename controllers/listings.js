// controllers/listings.js
const express = require('express');
const router = express.Router();
const Listing = require('../models/listings');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/auth/sign-in');
  }
};

// Get all listings
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find().populate('user', 'username');
    res.render('listings/index', { listings });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Search listings
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const listings = await Listing.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    }).populate('user', 'username');
    res.render('listings/index', { listings });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Create new listing form
router.get('/new', isLoggedIn, (req, res) => {
    res.render('listings/new', { user: req.session.user });
  });
  
// Create new listing
router.post('/', isLoggedIn, upload.array('photos', 5), async (req, res) => {
  try {
    const listing = new Listing({
      ...req.body,
      user: req.session.user._id,
      photos: req.files.map(file => file.path),
    });
    await listing.save();
    res.redirect('/listings');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Get single listing
router.get('/:id', async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('user', 'username');
    res.render('listings/show', { listing });
  } catch (error) {
    res.status(404).send('Listing not found');
  }
});

// Edit listing form
router.get('/:id/edit', isLoggedIn, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (listing.user.toString() !== req.session.user._id) {
      return res.status(403).send('Unauthorized');
    }
    res.render('listings/edit', { listing });
  } catch (error) {
    res.status(404).send('Listing not found');
  }
});

// Update listing
router.put('/:id', isLoggedIn, upload.array('photos', 5), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (listing.user.toString() !== req.session.user._id) {
      return res.status(403).send('Unauthorized');
    }
    listing.set({
      ...req.body,
      photos: req.files.map(file => file.path),
    });
    await listing.save();
    res.redirect(`/listings/${listing._id}`);
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Delete listing
router.delete('/:id', isLoggedIn, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (listing.user.toString() !== req.session.user._id) {
      return res.status(403).send('Unauthorized');
    }
    await listing.remove();
    res.redirect('/listings');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
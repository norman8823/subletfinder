// controllers/listings.js
const express = require('express');
const router = express.Router();
const Listing = require('../models/listings');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage});

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
    const listings = await Listing.find().populate('user', 'username').select('title price bedrooms borough photos');
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      // If it's an AJAX request or expects JSON, render without layout
      res.render('listings/index', { listings, layout: false });
    } else {
      // If it's a direct page access, redirect to home with tab parameter
      res.redirect('/?tab=browseListings');
    }
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).send('Error fetching listings');
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
      photos: req.files ? req.files.map(file => '/uploads/' + file.filename) : [],
    });
    await listing.save();
    res.redirect('/?tab=myListings');
  } catch (error) {
    console.error('Error creating listing:', error);
    res.status(400).render('listings/new', { 
      user: req.session.user, 
      error: error.message
    });
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
    if (!listing) {
      return res.status(404).send('Listing not found');
    }
    if (listing.user.toString() !== req.session.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }
    res.render('listings/edit', { listing, user: req.session.user });
  } catch (error) {
    console.error('Error fetching listing for edit:', error);
    res.status(500).send('Error fetching listing');
  }
});


// Update listing
router.put('/:id', isLoggedIn, upload.array('photos', 5), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).send('Listing not found');
    }
    if (listing.user.toString() !== req.session.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }
    
    // Update listing fields
    listing.title = req.body.title;
    listing.description = req.body.description;
    listing.price = req.body.price;
    listing.address = req.body.address;
    listing.zip = req.body.zip;
    listing.borough = req.body.borough;
    listing.neighborhood = req.body.neighborhood;
    listing.bedrooms = req.body.bedrooms;
    listing.shared = !!req.body.shared;
    listing.furnished = !!req.body.furnished;
    listing.petsAllowed = !!req.body.petsAllowed;

    // Handle photo deletion
    if (req.body.deletePhotos) {
      const photosToDelete = Array.isArray(req.body.deletePhotos) ? req.body.deletePhotos : [req.body.deletePhotos];
      listing.photos = listing.photos.filter(photo => !photosToDelete.includes(photo));   
    }
    // Handle new photos
    if (req.files && req.files.length > 0) {
      const newPhotos = req.files.map(file => '/uploads/' + file.filename);
      listing.photos = listing.photos.concat(newPhotos);
    }

    await listing.save();
    res.redirect('/?tab=myListings');
  } catch (error) {
    console.error('Error updating listing:', error);
    res.status(400).send('Error updating listing');
  }
});

// Delete listing
router.delete('/:id', isLoggedIn, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).send('Listing not found');
    }
    if (listing.user.toString() !== req.session.user._id.toString()) {
      return res.status(403).send('Unauthorized');
    }
    await Listing.findByIdAndDelete(req.params.id);
    res.redirect('/?tab=myListings');
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).send('Error deleting listing');
  }
});

module.exports = router;
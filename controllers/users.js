// controllers/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Listing = require('../models/listings');
const bcrypt = require('bcrypt');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/auth/sign-in');
  }
};

// Get user profile page
router.get('/profile', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).select('-password');
    const listings = await Listing.find({ user: req.session.user._id });
    res.render('users/profile', { user, listings, req });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Update email
router.post('/update-email', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    user.email = req.body.email;
    await user.save();
    res.redirect('/users/profile');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Update password
router.post('/update-password', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    const validPassword = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!validPassword) {
      return res.status(400).send('Current password is incorrect');
    }
    if (req.body.newPassword !== req.body.confirmNewPassword) {
      return res.status(400).send('New passwords do not match');
    }
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    res.redirect('/users/profile');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

router.get('/my-listings', isLoggedIn, async (req, res) => {
    try {
      const listings = await Listing.find({ user: req.session.user._id });
      res.render('users/my-listings', { listings, user: req.session.user });
    } catch (error) {
      console.error('Error fetching listings:', error);
      res.status(500).send('An error occurred while fetching your listings.');
    }
  });
  

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

const User = require('../models/user.js');

router.get('/sign-up', (req, res) => {
  res.render('auth/sign-up.ejs');
});

router.get('/sign-in', (req, res) => {
  res.render('auth/sign-in.ejs');
});

router.get('/sign-out', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

router.post('/sign-up', async (req, res) => {
  try {
    // Check if the username is already taken
    const userInDatabase = await User.findOne({ username: req.body.username });
    if (userInDatabase) {
      return res.send('Username already taken.');
    }
  
    // Username is not taken already!
    // Check if the password and confirm password match
    if (req.body.password !== req.body.confirmPassword) {
      return res.send('Password and Confirm Password must match');
    }
  
    // Must hash the password before sending to the database
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    req.body.password = hashedPassword;
  console.log(req.body)
    // All ready to create the new user!
    await User.create(req.body);
  
    res.redirect('/auth/sign-in');
  } catch (error) {
    console.log(error);

  }
});

router.post('/sign-in', async (req, res) => {
  try {
    console.log('Sign-in attempt for username:', req.body.username);
    const userInDatabase = await User.findOne({ username: req.body.username });
    
    if (!userInDatabase) {
      console.log('User not found in database');
      return res.send('Login failed. User not found.');
    }
  
    const validPassword = bcrypt.compareSync(
      req.body.password,
      userInDatabase.password
    );
    
    if (!validPassword) {
      console.log('Invalid password for user:', req.body.username);
      return res.send('Login failed. Incorrect password.');
    }
  
    req.session.user = {
      username: userInDatabase.username,
      _id: userInDatabase._id
    };
    
    console.log('User logged in successfully:', req.body.username);
    res.redirect('/'); // Redirect to home page
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).send('An error occurred during login. Please try again.');
  }
});
module.exports = router;

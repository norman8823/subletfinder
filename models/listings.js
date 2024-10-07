const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  address: { type: String, required: true },
  zip: { type: String, required: true },
  borough: { type: String },
  neighborhood: { type: String},
  bedrooms: { 
    type: String, 
    required: true,
    enum: ['Studio', '1 bed', '2 bed', '3 bed', '4 bed']
  },
  shared: { type: Boolean},
  furnished: { type: Boolean, default: false },
  petsAllowed: { type: Boolean},
  photos: [{ type: String }], // Array of photo URLs
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Listing', listingSchema);
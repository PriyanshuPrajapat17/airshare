const mongoose = require('mongoose');

// Trip schema for posting and matching shared airport cab rides
const tripSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  airport: {
    type: String,
    required: [true, 'Airport is required'],
    trim: true,
  },
  destination: {
    type: String,
    required: [true, 'Destination is required'],
    trim: true,
  },
  flightNumber: {
    type: String,
    trim: true,
    default: '',
  },
  arrivalTime: {
    type: Date,
    required: [true, 'Arrival date and time is required'],
  },
  fare: {
    type: Number,
    required: [true, 'Estimated fare is required'],
    min: [0, 'Fare cannot be negative'],
  },
  seats: {
    type: Number,
    required: [true, 'Seats available is required'],
    min: [1, 'At least 1 seat must be offered'],
    max: [3, 'Maximum 3 seats can be offered in a shared cab'],
  },
  upi: {
    type: String,
    trim: true,
    default: '',
  },
  joined: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  status: {
    type: String,
    enum: ['open', 'booked'],
    default: 'open',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Trip', tripSchema);

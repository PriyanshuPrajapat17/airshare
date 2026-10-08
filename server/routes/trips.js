const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const authMiddleware = require('../middleware/auth');

// GET /api/trips - List open trips with filters (public)
// Hides trips older than 3 hours past arrival time, sorted earliest first
router.get('/', async (req, res) => {
  try {
    const { airport, destination, date } = req.query;

    // Filter for open trips and arrivalTime >= 3 hours ago
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const filter = {
      status: 'open',
      arrivalTime: { $gte: threeHoursAgo },
    };

    if (airport && airport.trim()) {
      filter.airport = { $regex: airport.trim(), $options: 'i' };
    }

    if (destination && destination.trim()) {
      filter.destination = { $regex: destination.trim(), $options: 'i' };
    }

    if (date && date.trim()) {
      // Parse the date (YYYY-MM-DD) and match the entire calendar day
      const startOfDay = new Date(date);
      startOfDay.setUTCHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // Make sure we also respect the 3 hours past limit
      filter.arrivalTime = {
        $gte: startOfDay > threeHoursAgo ? startOfDay : threeHoursAgo,
        $lte: endOfDay,
      };
    }

    const trips = await Trip.find(filter).sort({ arrivalTime: 1 });
    res.json(trips);
  } catch (err) {
    console.error('Fetch trips error:', err);
    res.status(500).json({ message: 'Server error fetching trips.' });
  }
});

// POST /api/trips - Post a new trip (auth required)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { airport, destination, flightNumber, arrivalTime, fare, seats, upi } = req.body;

    if (!airport || !destination || !arrivalTime || fare === undefined || !seats) {
      return res.status(400).json({
        message: 'Airport, destination, arrival time, fare, and available seats are required.',
      });
    }

    const parsedFare = Number(fare);
    const parsedSeats = Number(seats);

    if (isNaN(parsedFare) || parsedFare <= 0) {
      return res.status(400).json({ message: 'Please enter a valid fare amount.' });
    }

    if (isNaN(parsedSeats) || parsedSeats < 1 || parsedSeats > 3) {
      return res.status(400).json({ message: 'Available seats must be between 1 and 3.' });
    }

    const parsedArrival = new Date(arrivalTime);
    if (isNaN(parsedArrival.getTime())) {
      return res.status(400).json({ message: 'Invalid arrival date/time format.' });
    }

    const trip = new Trip({
      owner: req.user.id,
      ownerName: req.user.name,
      airport: airport.trim(),
      destination: destination.trim(),
      flightNumber: flightNumber ? flightNumber.trim().toUpperCase() : '',
      arrivalTime: parsedArrival,
      fare: parsedFare,
      seats: parsedSeats,
      upi: upi ? upi.trim() : '',
      joined: [],
      status: 'open',
    });

    await trip.save();
    res.status(201).json(trip);
  } catch (err) {
    console.error('Create trip error:', err);
    res.status(500).json({ message: 'Server error creating trip.' });
  }
});

// POST /api/trips/:id/join - Join an open trip (auth required)
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    if (trip.status !== 'open') {
      return res.status(400).json({ message: 'This trip is already marked as booked and cannot be joined.' });
    }

    if (trip.owner.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot join your own trip.' });
    }

    const alreadyJoined = trip.joined.some((j) => j.user.toString() === req.user.id);
    if (alreadyJoined) {
      return res.status(400).json({ message: 'You have already joined this trip.' });
    }

    if (trip.joined.length >= trip.seats) {
      return res.status(400).json({ message: 'This trip has reached its maximum seats.' });
    }

    trip.joined.push({
      user: req.user.id,
      name: req.user.name,
      joinedAt: new Date(),
    });

    await trip.save();
    res.json(trip);
  } catch (err) {
    console.error('Join trip error:', err);
    res.status(500).json({ message: 'Server error joining trip.' });
  }
});

// POST /api/trips/:id/leave - Leave a joined trip (auth required)
router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    const wasJoined = trip.joined.some((j) => j.user.toString() === req.user.id);
    if (!wasJoined) {
      return res.status(400).json({ message: 'You are not joined in this trip.' });
    }

    trip.joined = trip.joined.filter((j) => j.user.toString() !== req.user.id);
    await trip.save();
    res.json(trip);
  } catch (err) {
    console.error('Leave trip error:', err);
    res.status(500).json({ message: 'Server error leaving trip.' });
  }
});

// PATCH /api/trips/:id/booked - Mark trip as booked (owner only)
router.patch('/:id/booked', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    if (trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the trip owner can mark this trip as booked.' });
    }

    trip.status = 'booked';
    await trip.save();
    res.json(trip);
  } catch (err) {
    console.error('Mark booked error:', err);
    res.status(500).json({ message: 'Server error updating trip status.' });
  }
});

// DELETE /api/trips/:id - Delete a trip (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found.' });
    }

    if (trip.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the trip owner can delete this trip.' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    res.json({ message: 'Trip deleted successfully.' });
  } catch (err) {
    console.error('Delete trip error:', err);
    res.status(500).json({ message: 'Server error deleting trip.' });
  }
});

module.exports = router;

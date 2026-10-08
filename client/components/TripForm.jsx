import React, { useState } from 'react';
import { api } from '../api';

export default function TripForm({ onTripCreated, onCancel }) {
  // Set default arrival time to 2 hours from now
  const getDefaultArrivalTime = () => {
    const d = new Date(Date.now() + 2 * 60 * 60 * 1000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [airport, setAirport] = useState('');
  const [destination, setDestination] = useState('');
  const [flightNumber, setFlightNumber] = useState('');
  const [arrivalTime, setArrivalTime] = useState(getDefaultArrivalTime());
  const [fare, setFare] = useState('');
  const [seats, setSeats] = useState(2);
  const [upi, setUpi] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!airport.trim() || !destination.trim() || !arrivalTime || !fare) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const createdTrip = await api.createTrip({
        airport: airport.trim(),
        destination: destination.trim(),
        flightNumber: flightNumber.trim(),
        arrivalTime: new Date(arrivalTime).toISOString(),
        fare: Number(fare),
        seats: Number(seats),
        upi: upi.trim(),
      });

      onTripCreated(createdTrip);
    } catch (err) {
      setError(err.message || 'Failed to post trip.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="section-title">
        <span>✈️ Post a Cab Share</span>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
          >
            Close
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="trip-airport">Landing Airport *</label>
          <input
            id="trip-airport"
            type="text"
            className="form-input"
            placeholder="e.g. BLR Kempegowda Airport or DEL T3"
            value={airport}
            onChange={(e) => setAirport(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="trip-destination">Final Destination *</label>
          <input
            id="trip-destination"
            type="text"
            className="form-input"
            placeholder="e.g. Koramangala / Indiranagar / Cyber City"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="trip-flight">Flight Number (Optional)</label>
            <input
              id="trip-flight"
              type="text"
              className="form-input"
              placeholder="e.g. 6E 2134"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="trip-arrival">Arrival Time *</label>
            <input
              id="trip-arrival"
              type="datetime-local"
              className="form-input"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="trip-fare">Estimated Total Fare (₹) *</label>
            <input
              id="trip-fare"
              type="number"
              min="50"
              max="50000"
              className="form-input"
              placeholder="e.g. 1200"
              value={fare}
              onChange={(e) => setFare(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="trip-seats">Seats to Share *</label>
            <select
              id="trip-seats"
              className="form-select"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
            >
              <option value={1}>1 Seat</option>
              <option value={2}>2 Seats</option>
              <option value={3}>3 Seats</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="trip-upi">Your UPI ID (for receiving split fare)</label>
          <input
            id="trip-upi"
            type="text"
            className="form-input"
            placeholder="e.g. yourname@oksbi or 9876543210@paytm"
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={loading}
          style={{ marginTop: '6px' }}
        >
          {loading ? 'Posting Trip...' : 'Publish Trip'}
        </button>
      </form>
    </div>
  );
}

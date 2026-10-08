import React, { useState } from 'react';
import { api } from '../api';

export default function TripCard({ trip, currentUser, onTripUpdated, onTripDeleted, onRequireAuth }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Check user relation to this trip
  const isOwner = currentUser && trip.owner && (trip.owner._id === currentUser.id || trip.owner === currentUser.id);
  const hasJoined = currentUser && trip.joined?.some((j) => (j.user?._id || j.user) === currentUser.id);
  const seatsLeft = Math.max(0, trip.seats - (trip.joined?.length || 0));
  const isFull = seatsLeft === 0;

  // Split calculations
  const totalTravellers = 1 + (trip.joined?.length || 0);
  const pricePerPerson = Math.ceil(trip.fare / totalTravellers);

  // Format arrival date & time
  const formatArrival = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // External App Links
  const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup[formatted_address]=${encodeURIComponent(
    trip.airport
  )}&dropoff[formatted_address]=${encodeURIComponent(trip.destination)}`;

  const rapidoUrl = 'https://www.rapido.bike/';

  const upiUrl = trip.upi
    ? `upi://pay?pa=${encodeURIComponent(trip.upi)}&pn=${encodeURIComponent(
        trip.ownerName
      )}&am=${pricePerPerson}&cu=INR&tn=AirShare`
    : null;

  const handleJoin = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    setError('');
    setLoading(true);
    try {
      const updated = await api.joinTrip(trip._id);
      onTripUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to join trip.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = async () => {
    setError('');
    setLoading(true);
    try {
      const updated = await api.leaveTrip(trip._id);
      onTripUpdated(updated);
    } catch (err) {
      setError(err.message || 'Failed to leave trip.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkBooked = async () => {
    if (!window.confirm('Mark this trip as booked in Uber/Rapido? It will be removed from public search.')) {
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.markBooked(trip._id);
      onTripDeleted(trip._id);
    } catch (err) {
      setError(err.message || 'Failed to update trip status.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip post?')) {
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.deleteTrip(trip._id);
      onTripDeleted(trip._id);
    } catch (err) {
      setError(err.message || 'Failed to delete trip.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUpi = () => {
    if (trip.upi) {
      navigator.clipboard.writeText(trip.upi);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  return (
    <div className="trip-card">
      {error && <div className="alert alert-error">{error}</div>}

      {/* Header with Route and Flight Number */}
      <div className="route-header">
        <div className="route-text">
          <span>{trip.airport}</span>
          <span className="route-arrow">➔</span>
          <span>{trip.destination}</span>
        </div>
        {trip.flightNumber && (
          <span className="flight-badge" title="Flight Number">
            ✈️ {trip.flightNumber}
          </span>
        )}
      </div>

      {/* Arrival and Seat details */}
      <div className="trip-details-grid">
        <div className="detail-item">
          <span className="detail-label">Landing Time</span>
          <span className="detail-value">🕒 {formatArrival(trip.arrivalTime)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Seats Available</span>
          <span className="detail-value">
            <span className={`seats-badge ${isFull ? 'full' : ''}`}>
              {isFull ? 'Full (0 left)' : `${seatsLeft} of ${trip.seats} left`}
            </span>
          </span>
        </div>
      </div>

      {/* Fare Breakdown */}
      <div className="fare-box">
        <div className="fare-per-person">
          <span className="detail-label">Your Share</span>
          <span className="fare-amount">₹{pricePerPerson}</span>
          <span className="fare-subtext">
            Total ₹{trip.fare} ÷ {totalTravellers} {totalTravellers === 1 ? 'person' : 'people'}
          </span>
        </div>
        <div>
          <span className="detail-label" style={{ textAlign: 'right', display: 'block' }}>
            Est. Total Fare
          </span>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text)' }}>
            ₹{trip.fare}
          </span>
        </div>
      </div>

      {/* Co-travellers list */}
      <div className="travellers-section">
        <span>Travellers in this cab ({totalTravellers}):</span>
        <div className="travellers-list">
          <span className="traveller-pill owner" title="Trip Creator & Cab Host">
            👑 {trip.ownerName} (Host)
          </span>
          {trip.joined?.map((j, idx) => (
            <span key={j.user?._id || j.user || idx} className="traveller-pill">
              👤 {j.name}
            </span>
          ))}
        </div>
      </div>

      {/* Primary Action Button (Join / Leave / Host Badge) */}
      {isOwner ? (
        <div className="owner-controls">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleMarkBooked}
            disabled={loading}
          >
            ✓ Mark as Booked
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={loading}
          >
            🗑️ Delete
          </button>
        </div>
      ) : hasJoined ? (
        <button
          type="button"
          className="btn btn-danger btn-block"
          onClick={handleLeave}
          disabled={loading}
        >
          {loading ? 'Leaving...' : 'Leave This Trip'}
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={handleJoin}
          disabled={loading || isFull}
        >
          {loading ? 'Joining...' : isFull ? 'Trip Full' : 'Join & Split Fare'}
        </button>
      )}

      {/* Cab Booking & Payment Links */}
      <div className="action-links">
        <a
          href={uberUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-uber"
          id={`uber-link-${trip._id}`}
        >
          🚗 Book on Uber
        </a>
        <a
          href={rapidoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-rapido"
          id={`rapido-link-${trip._id}`}
        >
          🛵 Open Rapido
        </a>

        {/* UPI Payment link (shown after joining or if owner, when UPI ID is provided) */}
        {(hasJoined || isOwner) && trip.upi && (
          <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <a
              href={upiUrl}
              className="btn btn-upi"
              id={`upi-link-${trip._id}`}
            >
              💸 Pay My Share (₹{pricePerPerson} via UPI)
            </a>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span>UPI: <strong>{trip.upi}</strong></span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 8px', fontSize: '0.72rem' }}
                onClick={handleCopyUpi}
              >
                {copiedUpi ? 'Copied!' : 'Copy UPI ID'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

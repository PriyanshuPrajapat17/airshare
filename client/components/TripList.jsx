import React, { useState } from 'react';
import TripCard from './TripCard';

export default function TripList({
  trips,
  currentUser,
  onTripUpdated,
  onTripDeleted,
  onRequireAuth,
  onFilterChange,
  loading,
}) {
  const [airport, setAirport] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    onFilterChange({ airport, destination, date });
  };

  const handleClear = () => {
    setAirport('');
    setDestination('');
    setDate('');
    onFilterChange({ airport: '', destination: '', date: '' });
  };

  const hasActiveFilters = airport || destination || date;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Search & Filters */}
      <form onSubmit={handleSearch} className="filters-card">
        <div className="filters-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-airport">Airport</label>
            <input
              id="filter-airport"
              type="text"
              className="form-input"
              placeholder="e.g. BLR"
              value={airport}
              onChange={(e) => setAirport(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-dest">Destination</label>
            <input
              id="filter-dest"
              type="text"
              className="form-input"
              placeholder="e.g. Indiranagar"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="filter-date">Date</label>
            <input
              id="filter-date"
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="submit" className="btn btn-primary btn-block" style={{ height: '42px' }}>
              Search
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ height: '42px' }}
                onClick={handleClear}
                title="Reset filters"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Trips list status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
          {hasActiveFilters ? 'Search Results' : 'Available Cab Shares'} ({trips.length})
        </h2>
        {loading && <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Refreshing...</span>}
      </div>

      {/* Trip Cards */}
      {trips.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🚖</div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No shared cabs found</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
            {hasActiveFilters
              ? 'Try adjusting or clearing your filters to see more upcoming trips.'
              : 'Be the first traveller to post a ride and find co-passengers landing around your flight time!'}
          </p>
        </div>
      ) : (
        trips.map((trip) => (
          <TripCard
            key={trip._id}
            trip={trip}
            currentUser={currentUser}
            onTripUpdated={onTripUpdated}
            onTripDeleted={onTripDeleted}
            onRequireAuth={onRequireAuth}
          />
        ))
      )}
    </div>
  );
}

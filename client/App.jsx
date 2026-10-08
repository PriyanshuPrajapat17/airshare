import React, { useState, useEffect } from 'react';
import { api } from './api';
import Login from './components/Login';
import TripForm from './components/TripForm';
import TripList from './components/TripList';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const [trips, setTrips] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  // Auto-authenticate on page load if token exists
  useEffect(() => {
    const token = localStorage.getItem('airshare_token');
    if (token) {
      api
        .getMe()
        .then((res) => {
          if (res.user) {
            setCurrentUser(res.user);
          }
        })
        .catch(() => {
          // If token is expired/invalid, clear it
          localStorage.removeItem('airshare_token');
          setCurrentUser(null);
        });
    }
  }, []);

  // Fetch trips whenever filters change
  const fetchTrips = async (currentFilters = filters) => {
    setLoading(true);
    try {
      const data = await api.getTrips(currentFilters);
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips(filters);
  }, [filters]);

  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setShowAuthModal(false);
    showNotice(`Welcome back, ${user.name}!`);
    fetchTrips();
  };

  const handleLogout = () => {
    localStorage.removeItem('airshare_token');
    setCurrentUser(null);
    setShowPostForm(false);
    showNotice('You have been logged out.');
  };

  const handleTripCreated = (newTrip) => {
    setShowPostForm(false);
    showNotice('🎉 Your cab share trip has been posted!');
    // Prepend new trip to list
    setTrips((prev) => [newTrip, ...prev]);
  };

  const handleTripUpdated = (updatedTrip) => {
    setTrips((prev) => prev.map((t) => (t._id === updatedTrip._id ? updatedTrip : t)));
    showNotice('Trip details updated.');
  };

  const handleTripDeleted = (deletedTripId) => {
    setTrips((prev) => prev.filter((t) => t._id !== deletedTripId));
    showNotice('Trip removed.');
  };

  const showNotice = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 4000);
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div
          className="brand"
          onClick={() => {
            setShowPostForm(false);
            setShowAuthModal(false);
          }}
        >
          <div>
            <h1>✈️ AirShare</h1>
            <div className="brand-tagline">Split Airport Cabs • Save 50-75%</div>
          </div>
        </div>

        <div className="auth-nav">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="user-badge" title={currentUser.email}>
                👤 {currentUser.name.split(' ')[0]}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowAuthModal(true)}
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Temporary notification alert */}
      {notice && <div className="alert alert-success">{notice}</div>}

      {/* Authentication Modal / Section */}
      {showAuthModal && !currentUser && (
        <Login
          onAuthSuccess={handleAuthSuccess}
          onCancel={() => setShowAuthModal(false)}
        />
      )}

      {/* Action Bar: Post Trip CTA */}
      {!showPostForm && !showAuthModal && (
        <button
          type="button"
          className="btn btn-primary btn-block"
          style={{ padding: '14px', fontSize: '1rem' }}
          onClick={() => {
            if (!currentUser) {
              setShowAuthModal(true);
            } else {
              setShowPostForm(true);
            }
          }}
        >
          ➕ Post a Shared Cab
        </button>
      )}

      {/* Post Trip Form */}
      {showPostForm && currentUser && (
        <TripForm
          onTripCreated={handleTripCreated}
          onCancel={() => setShowPostForm(false)}
        />
      )}

      {/* Trip Feed & Search Filters */}
      <TripList
        trips={trips}
        currentUser={currentUser}
        onTripUpdated={handleTripUpdated}
        onTripDeleted={handleTripDeleted}
        onRequireAuth={() => setShowAuthModal(true)}
        onFilterChange={setFilters}
        loading={loading}
      />

      {/* Footer Note */}
      <footer className="footer">
        <p>
          🛡️ <strong>Safety & Disclaimers:</strong> AirShare only connects travellers. Book your cab in Uber or Rapido and pay your co-traveller directly. Meet in public airport zones and verify your co-traveller.
        </p>
      </footer>
    </div>
  );
}

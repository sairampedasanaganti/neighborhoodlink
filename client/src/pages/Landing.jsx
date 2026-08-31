import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="landing">
      <section className="hero">
        <h1>Neighbors helping neighbors, organized.</h1>
        <p>
          NeighborLink connects people who need everyday help — groceries, medicine pickup,
          tutoring, emergency transport — with nearby verified volunteers, and tracks the
          whole process from request to completion.
        </p>
        <div className="hero-actions">
          <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
          <Link to="/login" className="btn btn-ghost btn-lg">Login</Link>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step"><span>1</span><h3>Request Help</h3><p>Describe what you need — the system calculates urgency automatically.</p></div>
          <div className="step"><span>2</span><h3>Get Matched</h3><p>Nearby, skilled, available volunteers are notified and ranked transparently.</p></div>
          <div className="step"><span>3</span><h3>Track Progress</h3><p>Watch status update live: Accepted → On the Way → In Progress → Completed.</p></div>
          <div className="step"><span>4</span><h3>Rate & Repeat</h3><p>Leave feedback, build trust, strengthen the neighborhood.</p></div>
        </div>
      </section>
    </div>
  );
}

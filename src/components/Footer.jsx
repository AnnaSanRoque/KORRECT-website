import { Link } from 'react-router-dom';
import logo from '../assets/KORRECT_logoBIG.png';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__grid">
        <div className="footer__brand">
          <img src={logo} alt="KORRECT" />
          <p>Ride Smart. Ride Korrect.</p>
        </div>
        <div className="footer__col">
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/news">News</Link>
          <Link to="/guide">Learn the Game</Link>
          <Link to="/quadtum">Quadtum</Link>
        </div>
        <div className="footer__col">
          <h4>Play</h4>
          <Link to="/play">Play Now</Link>
          <Link to="/download">Download</Link>
        </div>
      </div>
      <div className="footer__bar">
        <div className="wrap">&copy; 2026 KORRECT | Quadtum | All Rights Reserved.</div>
      </div>
    </footer>
  );
}

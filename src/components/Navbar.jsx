import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logo from '../assets/KORRECT_logo.png';
import { Icon } from './MotoArt';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/news', label: 'News' },
  { to: '/quadtum', label: 'Quadtum' },
];

export default function Navbar({ session, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const playTarget = session ? '/download' : '/play';

  return (
    <header className={`nav ${scrolled || open ? 'nav--solid' : ''}`}>
      <div className="nav__inner">
        <Link to="/" className="nav__logo" aria-label="KORRECT home">
          <img src={logo} alt="KORRECT" />
        </Link>

        <nav className={`nav__links ${open ? 'is-open' : ''}`} aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav__link ${isActive ? 'is-active' : ''}`}>
              {l.label}
            </NavLink>
          ))}

          <div className="nav__mobile-actions">
            <Link to={playTarget} className="btn btn--sm">
              <span>Play Now</span>
            </Link>
            {session && (
              <>
                <Link to="/account" className="nav__link">My Account</Link>
                <button type="button" className="nav__link nav__link--btn" onClick={onLogout}>Log out</button>
              </>
            )}
          </div>
        </nav>

        <div className="nav__right">
          {session && (
            <NavLink to="/account" className={({ isActive }) => `nav__link nav__account ${isActive ? 'is-active' : ''}`}>
              <Icon.User width="16" height="16" />
              <span>My Account</span>
            </NavLink>
          )}
          <Link to={playTarget} className="btn btn--sm nav__play">
            <span>Play Now</span>
          </Link>
          {session && (
            <button type="button" className="nav__icon" onClick={onLogout} aria-label="Log out" title="Log out">
              <Icon.Logout width="20" height="20" />
            </button>
          )}
          <button type="button" className="nav__burger" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <Icon.Close width="26" height="26" /> : <Icon.Menu width="26" height="26" />}
          </button>
        </div>
      </div>
    </header>
  );
}

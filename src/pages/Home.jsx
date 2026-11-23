import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Motorcycle, Tachometer, RoadLines, Icon } from '../components/MotoArt';
import NewsArt from '../components/NewsArt';
import QuadtumMark from '../components/QuadtumMark';
import { NEWS, formatDate } from '../data/news';
import korrectLogo from '../assets/KORRECT_logo.png';

export function NewsCard({ item, featured = false }) {
  return (
    <Link to={`/news/${item.slug}`} className={`news-card ${featured ? 'news-card--featured' : ''}`}>
      <div className="news-card__art">
        <NewsArt item={item} />
        <span className="news-card__tag">{item.category}</span>
      </div>
      <div className="news-card__body">
        <time>{formatDate(item.date)}</time>
        <h3>{item.title}</h3>
        <p>{item.summary}</p>
        <span className="news-card__more">Read more <Icon.Arrow width="16" height="16" /></span>
      </div>
    </Link>
  );
}

export default function Home({ session }) {
  // Hero picture: put KORRECT_logoBIG.png in the "public" folder.
  // If that file is missing, the normal logo is shown instead.
  const [bigMissing, setBigMissing] = useState(false);
  const playTarget = session ? '/download' : '/play';

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero__glow" />
        <div className="hero__slash hero__slash--a" />
        <div className="hero__slash hero__slash--b" />
        <Motorcycle className="hero__moto" />
        <RoadLines className="hero__road" />
        <div className="hero__streaks" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>

        <div className="hero__content">
          <h1 className="hero__title">
            <img
              className="hero__logo"
              src={bigMissing ? korrectLogo : '/KORRECT_logoBIG.png'}
              alt="KORRECT"
              onError={() => setBigMissing(true)}
            />
          </h1>
          <p className="hero__tagline">Ride Smart. Ride Korrect</p>
          <Link to={playTarget} className="btn btn--lg">
            <span>Play for Free</span>
          </Link>
        </div>

      </section>

      {/* LATEST NEWS */}
      <section className="section" id="latest-news">
        <div className="wrap">
          <div className="section__head">
            <div>
              <p className="eyebrow">What is new</p>
              <h2 className="section__title">Latest News</h2>
            </div>
            <Link to="/news" className="link-arrow">View all news <Icon.Arrow width="18" height="18" /></Link>
          </div>

          <div className="news-grid">
            {NEWS.slice(0, 3).map((item, i) => (
              <NewsCard key={item.slug} item={item} featured={i === 0} />
            ))}
          </div>
        </div>
      </section>

      {/* THE GAME */}
      <section className="section section--dark intro">
        <div className="wrap intro__grid">
          <div className="intro__art" aria-hidden="true">
            <Tachometer className="intro__tach" />
          </div>

          <div className="intro__copy">
            <p className="eyebrow">The game</p>
            <h2 className="section__title">Ride KORRECT</h2>
            <p>
              KORRECT is a mobile motorcycle simulation built for aspiring riders in Valenzuela City.
              Step into realistic traffic situations and learn the difference between a safe rider and a kamote before you ever face real roads.
              Every violation costs you points, every clean run earns you stars, and every mission ends with feedback on how to ride better.
              It is a supplementary learning tool and does not replace formal driving instruction or LTO licensing.
            </p>
            <Link to="/guide" className="btn">
              <span>Learn the Game</span>
            </Link>
          </div>
        </div>
      </section>

      {/* DEVELOPERS */}
      <section className="section devs">
        <div className="wrap devs__inner">
          <p className="eyebrow">Made by</p>
          <div className="devs__mark"><QuadtumMark size={150} /></div>
          <p className="devs__text">
            This project was developed as an undergraduate capstone project under the College of Engineering and Information Technology at Pamantasan ng Lungsod ng Valenzuela.
          </p>
          <Link to="/quadtum" className="btn btn--ghost">
            <span>Meet the Team</span>
          </Link>
        </div>
      </section>
    </>
  );
}
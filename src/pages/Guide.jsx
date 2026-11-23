import { Link } from 'react-router-dom';
import { Tachometer } from '../components/MotoArt';

const STEPS = [
  { t: 'Create your account', d: 'Press Play Now, create a KORRECT account and confirm your email with the code we send you.' },
  { t: 'Download and install', d: 'After logging in, download the KORRECT app on your Android phone and open the file to install it.' },
  { t: 'Sign in on the app', d: 'Use the same account in the game so your progress, stars and records follow you.' },
  { t: 'Take the lessons', d: 'Start with the basic motorcycle lessons. They explain the rules before the missions test them.' },
  { t: 'Ride the missions', d: 'Complete each mission without breaking the rules. Read the feedback at the end and try again to improve.' },
];

const VIOLATIONS = [
  { t: 'Overspeeding', d: 'Riding faster than the limit allowed for the road you are on.' },
  { t: 'Counterflowing', d: 'Riding against the direction of traffic, which puts you head-on with other vehicles.' },
  { t: 'Illegal overtaking', d: 'Passing another vehicle where it is not allowed or not safe to do so.' },
];

const SEE = [
  { t: 'Points', d: 'You start each mission with a set number of points. Violations take points away.' },
  { t: 'Traffic and weather', d: 'Other vehicles and basic weather conditions change how you need to ride.' },
  { t: 'Mission feedback', d: 'When a run ends you see your result, stars, score and safety rating.' },
];

export default function Guide({ session }) {
  return (
    <>
      <section className="page-hero page-hero--guide">
        <Tachometer className="page-hero__tach" />
        <div className="wrap">
          <p className="eyebrow">Beginner&apos;s Guide</p>
          <h1>Learn the Game</h1>
          <p className="page-hero__lead">Everything you need to know before your first ride in KORRECT.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section__head"><div><p className="eyebrow">Overview</p><h2 className="section__title">What you will see</h2></div></div>
          <div className="card-grid">
            {SEE.map((s) => (
              <div className="info-card" key={s.t}><h3>{s.t}</h3><p>{s.d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="wrap">
          <div className="section__head"><div><p className="eyebrow">Getting started</p><h2 className="section__title">How to play</h2></div></div>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <li key={s.t} className="step">
                <span className="step__num">{String(i + 1).padStart(2, '0')}</span>
                <div><h3>{s.t}</h3><p>{s.d}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section__head"><div><p className="eyebrow">Know the rules</p><h2 className="section__title">Violations to avoid</h2></div></div>
          <div className="card-grid">
            {VIOLATIONS.map((v) => (
              <div className="info-card info-card--warn" key={v.t}><h3>{v.t}</h3><p>{v.d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--dark">
        <div className="wrap two-col">
          <div>
            <p className="eyebrow">Scoring</p>
            <h2 className="section__title">Stars, score and rank</h2>
            <p className="lead-text">
              A clean run keeps your points high, and the points you keep decide how many stars you earn. Stars add up to your Rider Rank, and your best scores can place you on the leaderboard.
            </p>
            <p className="lead-text">
              Do not chase speed. A calm, rule-abiding run always beats a fast, reckless one.
            </p>
          </div>
          <ul className="tips">
            <li>Check the speed limit before you accelerate.</li>
            <li>Stay in your lane and follow the flow of traffic.</li>
            <li>Only overtake when it is allowed and clearly safe.</li>
            <li>Slow down when the weather or traffic gets worse.</li>
            <li>Read your mission feedback, then replay to improve.</li>
          </ul>
        </div>
      </section>

      <section className="cta">
        <div className="wrap cta__inner">
          <h2>Ready to ride?</h2>
          <Link to={session ? '/download' : '/play'} className="btn btn--lg"><span>{session ? 'Download KORRECT' : 'Play Now'}</span></Link>
        </div>
      </section>
    </>
  );
}

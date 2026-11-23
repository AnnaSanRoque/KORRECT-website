import { useState } from 'react';
import QuadtumMark from '../components/QuadtumMark';

// Team members. To show a photo, save it in  public/team/  using the file name below
// (for example public/team/lorence.jpg). Until the file exists, the first letter is shown.
const TEAM = [
  { name: 'Lorence', role: 'Developer Lead', photo: '/team/lorence.jpg' },
  { name: 'Theo', role: 'Design Lead', photo: '/team/theo.jpg' },
  { name: 'Kristal', role: 'Document Lead', photo: '/team/kristal.jpg' },
  { name: 'Anna', role: 'Project Lead', photo: '/team/anna.jpg' },
];

function TeamAvatar({ name, photo }) {
  const [missing, setMissing] = useState(false);
  return (
    <div className="team__avatar">
      {missing ? name[0] : <img src={photo} alt={name} onError={() => setMissing(true)} />}
    </div>
  );
}

const WORK = [
  { t: 'Motorcycle simulation', d: 'A mobile simulation where beginner riders practice real traffic situations safely.' },
  { t: 'Gamified missions', d: 'Missions, points and stars that reward clean, rule-abiding riding.' },
  { t: 'Performance feedback', d: 'Reports on violations, completed levels and scores so riders can see how they improve.' },
];

export default function Quadtum() {
  return (
    <>
      <section className="page-hero page-hero--center">
        <div className="wrap">
          <h1 className="quadtum-hero"><QuadtumMark size={700} /></h1>
          <p className="page-hero__lead">The team behind KORRECT.</p>
        </div>
      </section>

      <section className="section">
        <div className="wrap wrap--narrow center">
          <p className="eyebrow">About us</p>
          <h2 className="section__title">Built for safer roads</h2>
          <p className="lead-text">
            quadtum is the development team that created KORRECT. This project was developed as an undergraduate capstone project under the College of Engineering and Information Technology at Pamantasan ng Lungsod ng Valenzuela.
          </p>
          <p className="lead-text">
            Many aspiring riders learn informally from friends or family. We built KORRECT to give them a safer, more interactive way to recognize unsafe riding behaviors before they experience real traffic.
          </p>
        </div>
      </section>

      <section className="section section--dark">
        <div className="wrap">
          <div className="section__head"><div><p className="eyebrow">The team</p><h2 className="section__title">Meet the Team</h2></div></div>
          <div className="team">
            {TEAM.map((m) => (
              <div className="team__card" key={m.name}>
                <TeamAvatar name={m.name} photo={m.photo} />
                <h3>{m.name}</h3>
                <p>{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section__head"><div><p className="eyebrow">What we built</p><h2 className="section__title">The project</h2></div></div>
          <div className="card-grid">
            {WORK.map((w) => (
              <div className="info-card" key={w.t}><h3>{w.t}</h3><p>{w.d}</p></div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
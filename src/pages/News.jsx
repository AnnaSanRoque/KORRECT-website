import { useState } from 'react';
import { NEWS, NEWS_CATEGORIES } from '../data/news';
import { NewsCard } from './Home';

export default function News() {
  const [category, setCategory] = useState('All');
  const items = NEWS.filter((n) => category === 'All' || n.category === category);

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <p className="eyebrow">KORRECT</p>
          <h1>News</h1>
          <p className="page-hero__lead">Game updates, guides and announcements from the KORRECT team.</p>
        </div>
      </section>

      <section className="section section--tight">
        <div className="wrap">
          <div className="chips" role="tablist" aria-label="Filter news">
            {NEWS_CATEGORIES.map((c) => (
              <button key={c} type="button" role="tab" aria-selected={category === c} className={`chip ${category === c ? 'is-active' : ''}`} onClick={() => setCategory(c)}>
                {c}
              </button>
            ))}
          </div>

          <div className="news-grid news-grid--all">
            {items.map((item) => (
              <NewsCard key={item.slug} item={item} />
            ))}
          </div>
          {items.length === 0 && <p className="empty">Nothing here yet.</p>}
        </div>
      </section>
    </>
  );
}

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { NEWS, formatDate } from '../data/news';
import { NewsMotif, Icon } from '../components/MotoArt';
import { NewsCard } from './Home';

export default function Article() {
  const { slug } = useParams();
  const article = NEWS.find((n) => n.slug === slug);
  const [coverFailed, setCoverFailed] = useState(false);
  const hasCover = Boolean(article?.image) && !coverFailed;

  if (!article) {
    return (
      <section className="page-hero page-hero--center">
        <div className="wrap">
          <p className="eyebrow">404</p>
          <h1>Article not found</h1>
          <p className="page-hero__lead">That story does not exist or has been moved.</p>
          <Link to="/news" className="btn"><span>Back to News</span></Link>
        </div>
      </section>
    );
  }

  const more = NEWS.filter((n) => n.slug !== slug).slice(0, 3);

  return (
    <>
      <article>
        <header className="article-hero">
          {!hasCover && <div className="article-hero__art"><NewsMotif type={article.motif} /></div>}
          <div className="wrap wrap--narrow">
            <Link to="/news" className="back-link"><Icon.Back width="16" height="16" /> All news</Link>
            <p className="eyebrow">{article.category}</p>
            <h1>{article.title}</h1>
            <p className="article-meta">{formatDate(article.date)} &middot; {article.readTime}</p>
          </div>
        </header>

        <div className="wrap wrap--narrow article-body">
          {hasCover && (
            <img className="article-cover" src={article.image} alt={article.title} onError={() => setCoverFailed(true)} />
          )}
          {article.body.map((block, i) => {
            if (block.type === 'h') return <h2 key={i}>{block.text}</h2>;
            if (block.type === 'list') return <ul key={i}>{block.items.map((li) => <li key={li}>{li}</li>)}</ul>;
            return <p key={i}>{block.text}</p>;
          })}
        </div>
      </article>

      <section className="section section--dark">
        <div className="wrap">
          <div className="section__head">
            <h2 className="section__title">More news</h2>
          </div>
          <div className="news-grid news-grid--all">
            {more.map((item) => <NewsCard key={item.slug} item={item} />)}
          </div>
        </div>
      </section>
    </>
  );
}
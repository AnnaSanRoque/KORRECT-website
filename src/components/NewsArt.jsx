import { useState } from 'react';
import { NewsMotif } from './MotoArt';

// Shows the article's picture (item.image). If there is no picture yet, or the file
// is missing, the drawn icon is shown instead so the card never looks broken.
export default function NewsArt({ item }) {
  const [failed, setFailed] = useState(false);

  if (item.image && !failed) {
    return (
      <img
        className="news-card__img"
        src={item.image}
        alt={item.title}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return <NewsMotif type={item.motif} />;
}
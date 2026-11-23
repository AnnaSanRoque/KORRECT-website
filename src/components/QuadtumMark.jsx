import { useState } from 'react';

// The Quadtum logo. Save your logo in the "public" folder named  quadtum-logo.png
// (.jpg, .jpeg, .webp and .svg with the same name also work).
// Only if no logo file exists, the word "quadtum" is shown so the page is not empty.
const CANDIDATES = [
  '/quadtum-logo.png',
  '/quadtum-logo.jpg',
  '/quadtum-logo.jpeg',
  '/quadtum-logo.webp',
  '/quadtum-logo.svg',
];

export default function QuadtumMark({ size = 140 }) {
  const [index, setIndex] = useState(0);

  if (index >= CANDIDATES.length) {
    return <span className="qmark-text">quadtum</span>;
  }

  return (
    <img
      className="qmark"
      src={CANDIDATES[index]}
      alt="Quadtum"
      style={{ height: size }}
      onError={() => setIndex(index + 1)}
    />
  );
}
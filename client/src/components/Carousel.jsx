import { Link } from 'react-router-dom';

export function thumb(post) {
  return (post.media || []).find((m) => m.type !== 'video');
}

export default function Carousel({ posts }) {
  if (!posts.length) return <p className="muted">No heropacks yet – check back soon!</p>;
  // Repeat enough to fill the track, then duplicate once for a seamless loop.
  const base = Array.from({ length: Math.max(1, Math.ceil(6 / posts.length)) }, () => posts).flat();
  const items = [...base, ...base];
  return (
    <div className="carousel" aria-label="Featured heropacks">
      <div className="track" style={{ animationDuration: `${base.length * 5}s` }}>
        {items.map((p, i) => {
          const t = thumb(p);
          return (
            <Link key={i} to={`/post/${p.id}`} className="card" aria-hidden={i >= base.length}>
              <div className="thumb">{t ? <img src={t.url} alt="" loading="lazy" /> : <span>🦸</span>}</div>
              <h3>{p.title}</h3>
              <p className="muted">by {p.creatorName}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

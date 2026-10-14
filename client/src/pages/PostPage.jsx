import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Links from '../components/Links.jsx';
import Media from '../components/Media.jsx';

export default function PostPage() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api(`/api/posts/${id}`).then(setPost).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="section"><p className="error">{error}</p><Link to="/">← Back home</Link></div>;
  if (!post) return <div className="section"><p className="muted">Loading…</p></div>;
  return (
    <article className="section post">
      <Link to="/">← Back home</Link>
      <h1>{post.title}</h1>
      <p className="muted">by {post.creatorName}</p>
      <p className="desc">{post.description}</p>
      <Links links={post.links} />
      <div className="gallery">{post.media.map((m) => <Media key={m.url} item={m} />)}</div>
    </article>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Carousel from '../components/Carousel.jsx';

export default function Home() {
  const [posts, setPosts] = useState(null);

  useEffect(() => {
    api('/api/featured').then(setPosts).catch(() => setPosts([]));
  }, []);

  return (
    <>
      <section className="hero">
        <h1>META <span>CORE</span></h1>
        <p>The ultimate superhero addon for Minecraft Bedrock Edition. Discover heropacks built by the community's trusted creators.</p>
      </section>
      <section className="section">
        <h2>Featured Heropacks</h2>
        {posts === null ? <p className="muted">Loading…</p> : <Carousel posts={posts} />}
      </section>
      <section className="section about">
        <h2>About Meta Core</h2>
        <p>Meta Core is a Minecraft Bedrock superhero addon. Heropacks extend it with new heroes, powers and abilities, and every heropack is randomly featured in the carousel above.</p>
        <p>Heropack creators: log in from the top right with the code you received by DM to create or edit your post.</p>
      </section>
    </>
  );
}

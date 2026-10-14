import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Links from '../components/Links.jsx';
import Media from '../components/Media.jsx';

const empty = { title: '', description: '', links: [], media: [] };

export default function Dashboard({ me }) {
  const [post, setPost] = useState(null);
  const [form, setForm] = useState(empty);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me) return;
    api('/api/me').then((d) => {
      setPost(d.post);
      if (d.post) setForm({ title: d.post.title, description: d.post.description, links: d.post.links, media: d.post.media });
    });
  }, [me]);

  if (!me) return <div className="section"><p>Please log in as a creator (top right) to manage your heropack post.</p></div>;

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const addLink = () => {
    try {
      const u = new URL(linkUrl);
      if (!['http:', 'https:'].includes(u.protocol)) throw new Error();
    } catch {
      setError('Enter a valid link starting with http:// or https://');
      return;
    }
    setError('');
    set({ links: [...form.links, { url: linkUrl, label: linkLabel, type: 'website' }] });
    setLinkUrl('');
    setLinkLabel('');
  };

  const upload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const m = await api('/api/uploads', { method: 'POST', form: fd });
      set({ media: [...form.media, m] });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    try {
      const saved = post
        ? await api('/api/posts/me', { method: 'PUT', body: form })
        : await api('/api/posts', { method: 'POST', body: form });
      setPost(saved);
      setForm({ title: saved.title, description: saved.description, links: saved.links, media: saved.media });
      setStatus('Saved!');
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete your heropack post?')) return;
    await api('/api/posts/me', { method: 'DELETE' });
    setPost(null);
    setForm(empty);
    setStatus('Post deleted.');
  };

  return (
    <div className="section">
      <h1>{post ? 'Edit your heropack post' : 'Create your heropack post'}</h1>
      <p className="notice">
        ⚠️ Each creator has <strong>one</strong> post per heropack. Creating multiple posts for the same heropack is
        redundant – all heropacks are randomly featured in the scrolling “Featured Heropacks” list. Edit your existing post instead.
      </p>
      <form className="editor" onSubmit={save}>
        <label>
          Heropack name
          <input value={form.title} onChange={(e) => set({ title: e.target.value })} maxLength={100} required />
        </label>
        <label>
          Description
          <textarea rows={8} value={form.description} onChange={(e) => set({ description: e.target.value })} maxLength={5000} />
        </label>

        <h3>Links</h3>
        <p className="muted">Discord, social media, CurseForge, MCPEDL…</p>
        <Links links={form.links} />
        <ul className="list">
          {form.links.map((l, i) => (
            <li key={i}>
              <span>{l.label || l.url}</span>
              <button type="button" className="btn ghost" onClick={() => set({ links: form.links.filter((_, j) => j !== i) })}>Remove</button>
            </li>
          ))}
        </ul>
        <div className="row">
          <input placeholder="https://…" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
          <input placeholder="Label (optional)" value={linkLabel} onChange={(e) => setLinkLabel(e.target.value)} />
          <button type="button" className="btn" onClick={addLink}>Add link</button>
        </div>

        <h3>Images, videos &amp; GIFs</h3>
        <p className="muted">PNG, JPG, WEBP, GIF, MP4 or WEBM – up to 25MB each.</p>
        <div className="gallery">
          {form.media.map((m) => (
            <div key={m.url} className="media-item">
              <Media item={m} />
              <button type="button" className="btn ghost" onClick={() => set({ media: form.media.filter((x) => x.url !== m.url) })}>Remove</button>
            </div>
          ))}
        </div>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" onChange={upload} disabled={busy} />

        {error && <p className="error">{error}</p>}
        {status && <p className="ok">{status}</p>}
        <div className="row">
          <button className="btn" type="submit" disabled={busy}>{post ? 'Save changes' : 'Create post'}</button>
          {post && <Link className="btn ghost" to={`/post/${post.id}`}>View post</Link>}
          {post && <button type="button" className="btn danger" onClick={remove}>Delete post</button>}
        </div>
      </form>
    </div>
  );
}

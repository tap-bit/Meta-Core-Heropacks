import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, setToken } from '../api.js';

export default function LoginMenu({ me, onLogin, onLogout }) {
  const [open, setOpen] = useState(false);
  const [creators, setCreators] = useState([]);
  const [creatorId, setCreatorId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && !creators.length) api('/api/creators').then(setCreators).catch(() => {});
  }, [open, creators.length]);

  if (me) {
    return (
      <div className="login-area">
        <span className="who">{me.name}</span>
        <Link className="btn" to="/dashboard">My Post</Link>
        <button className="btn ghost" onClick={onLogout}>Log out</button>
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const d = await api('/api/login', { method: 'POST', body: { creatorId, code } });
      setToken(d.token);
      onLogin(d.creator);
      setOpen(false);
      setCode('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-area">
      <button className="btn" onClick={() => setOpen(!open)}>Creator Login</button>
      {open && (
        <form className="login-pop" onSubmit={submit}>
          <label>
            Heropack creator
            <select value={creatorId} onChange={(e) => setCreatorId(e.target.value)} required>
              <option value="">Select your name…</option>
              {creators.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>
            Login code
            <input type="password" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code sent to you by DM" required autoComplete="off" />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit">Log in</button>
        </form>
      )}
    </div>
  );
}

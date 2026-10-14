import { useEffect, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { api, getToken, setToken } from './api.js';
import LoginMenu from './components/LoginMenu.jsx';
import Home from './pages/Home.jsx';
import PostPage from './pages/PostPage.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    if (!getToken()) return;
    api('/api/me').then((d) => setMe(d.creator)).catch(() => setToken(null));
  }, []);

  const logout = async () => {
    await api('/api/logout', { method: 'POST' }).catch(() => {});
    setToken(null);
    setMe(null);
  };

  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">META <span>CORE</span></Link>
        <LoginMenu me={me} onLogin={setMe} onLogout={logout} />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/dashboard" element={<Dashboard me={me} />} />
        </Routes>
      </main>
      <footer className="footer">Meta Core – Minecraft Bedrock Superhero Addon</footer>
    </>
  );
}

const ICONS = { discord: '💬', curseforge: '🔥', mcpedl: '📦', youtube: '▶️', twitter: '🐦', tiktok: '🎵', instagram: '📷', twitch: '🎮', website: '🔗' };

export default function Links({ links }) {
  if (!links?.length) return null;
  return (
    <div className="links">
      {links.map((l, i) => (
        <a key={i} className="btn ghost" href={l.url} target="_blank" rel="noopener noreferrer nofollow">
          {ICONS[l.type] || '🔗'} {l.label}
        </a>
      ))}
    </div>
  );
}

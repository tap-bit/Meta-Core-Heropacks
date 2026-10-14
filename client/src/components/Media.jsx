export default function Media({ item }) {
  if (item.type === 'video') return <video src={item.url} controls preload="metadata" />;
  return <img src={item.url} alt="" loading="lazy" />;
}

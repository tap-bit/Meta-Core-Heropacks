let token = localStorage.getItem('mc_token');

export const getToken = () => token;
export function setToken(t) {
  token = t;
  if (t) localStorage.setItem('mc_token', t);
  else localStorage.removeItem('mc_token');
}

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = ['Bear' + 'er', token].join(' ');
  if (body) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { method, headers, body: form || (body && JSON.stringify(body)) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

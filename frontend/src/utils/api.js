// filepath: /Users/akbroc/Desktop/ML/frontend/src/utils/api.js
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://127.0.0.1:8000';

export function getActiveUserId() {
  try {
    const p = JSON.parse(localStorage.getItem('user_profile_v1') || '{}');
    const raw = (p?.name || localStorage.getItem('username') || 'guest').trim().toLowerCase();
    return raw || 'guest';
  } catch {
    const raw = (localStorage.getItem('username') || 'guest').trim().toLowerCase();
    return raw || 'guest';
  }
}

export async function deleteUserData(userId) {
  const url = `${API_BASE}/delete-user-data`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: userId })
  });
  if (!resp.ok) {
    let msg = 'Failed to delete user data';
    try { msg = (await resp.json())?.detail || msg; } catch {}
    throw new Error(msg);
  }
  try { return await resp.json(); } catch { return {}; }
}

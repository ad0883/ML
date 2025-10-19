// filepath: /Users/akbroc/Desktop/ML/frontend/src/utils/achievements.js
export const KEY_ACHIEVEMENTS = 'achievements_v1';
const KEY_LAST_UNLOCKED = 'last_achievement_unlocked';

export function getAchievements() {
  try { return JSON.parse(localStorage.getItem(KEY_ACHIEVEMENTS) || '{}'); } catch { return {}; }
}

export function isUnlocked(id) {
  const a = getAchievements();
  return !!a[id];
}

export function unlockAchievement(id, at = Date.now()) {
  const a = getAchievements();
  if (a[id]) return false; // already unlocked
  a[id] = at;
  try { localStorage.setItem(KEY_ACHIEVEMENTS, JSON.stringify(a)); } catch {}

  // Broadcast to the app (same tab)
  try { window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: { id, at } })); } catch {}

  // Trigger storage event across tabs/pages
  try { localStorage.setItem(KEY_LAST_UNLOCKED, JSON.stringify({ id, at, nonce: Math.random() })); } catch {}
  return true;
}

export function onAchievement(handler) {
  const onCE = (e) => { if (e?.detail?.id) handler(e.detail); };
  const onStorage = (e) => {
    if (e.key === KEY_LAST_UNLOCKED && e.newValue) {
      try { const payload = JSON.parse(e.newValue); if (payload?.id) handler(payload); } catch {}
    }
  };
  window.addEventListener('achievement-unlocked', onCE);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener('achievement-unlocked', onCE);
    window.removeEventListener('storage', onStorage);
  };
}

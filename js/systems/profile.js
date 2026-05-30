import { profile } from "../core/state.js";

// Simpan waktu pertama kali main
function getFirstPlay() {
  let first = localStorage.getItem("rimm_first_play");
  if (!first) {
    first = Date.now().toString();
    localStorage.setItem("rimm_first_play", first);
  }
  return parseInt(first);
}

function formatDuration(ms) {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam`;
  return "Baru mulai";
}

export function updateProfile(win) {
  profile.match++;
  win ? profile.win++ : profile.lose++;
  renderProfile();
}

export function renderProfile() {
  const winRate = profile.match > 0
    ? Math.round((profile.win / profile.match) * 100)
    : 0;

  const activeSince = formatDuration(Date.now() - getFirstPlay());

  const el = document.getElementById("profileInfo");
  if (!el) return;

  el.innerHTML = `
    <div class="profile-stat">
      <span class="stat-label">👤 Name</span>
      <span class="stat-val">${profile.name}</span>
    </div>
    <div class="profile-stat">
      <span class="stat-label">🕐 Aktif</span>
      <span class="stat-val">${activeSince}</span>
    </div>
    <div class="profile-stat">
      <span class="stat-label">🎮 Match</span>
      <span class="stat-val">${profile.match}</span>
    </div>
    <div class="profile-stat">
      <span class="stat-label">✅ Win</span>
      <span class="stat-val win-text">${profile.win}</span>
    </div>
    <div class="profile-stat">
      <span class="stat-label">❌ Lose</span>
      <span class="stat-val lose-text">${profile.lose}</span>
    </div>
    <div class="profile-stat">
      <span class="stat-label">📊 Rate</span>
      <span class="stat-val ${winRate >= 50 ? 'win-text' : 'lose-text'}">${winRate}%</span>
    </div>
  `;
}

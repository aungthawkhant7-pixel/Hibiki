// Hibiki 響 — Music Player
// Features: search, playlist saving, recently played, dark/light mode, mobile support

const DEMO_TRACKS = [
  { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', channel: 'Rick Astley', thumb: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg' },
  { id: 'JGwWNGJdvx8', title: 'Shape of You', channel: 'Ed Sheeran', thumb: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg' },
  { id: 'kTJczUoc26U', title: 'Starboy', channel: 'The Weeknd', thumb: 'https://i.ytimg.com/vi/kTJczUoc26U/mqdefault.jpg' },
  { id: 'RgKAFK5djSk', title: 'See You Again', channel: 'Wiz Khalifa', thumb: 'https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg' },
  { id: 'OPf0YbXqDm0', title: 'Uptown Funk', channel: 'Mark Ronson', thumb: 'https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg' },
  { id: 'hT_nvWreIhg', title: 'Counting Stars', channel: 'OneRepublic', thumb: 'https://i.ytimg.com/vi/hT_nvWreIhg/mqdefault.jpg' },
  { id: 'CevxZvSJLk8', title: 'Roar', channel: 'Katy Perry', thumb: 'https://i.ytimg.com/vi/CevxZvSJLk8/mqdefault.jpg' },
  { id: '09R8_2nJtjg', title: 'Sugar', channel: 'Maroon 5', thumb: 'https://i.ytimg.com/vi/09R8_2nJtjg/mqdefault.jpg' },
  { id: 'kJQP7kiw5Fk', title: 'Despacito', channel: 'Luis Fonsi', thumb: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg' },
  { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody', channel: 'Queen', thumb: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg' },
  { id: 'YQHsXMglC9A', title: 'Hello', channel: 'Adele', thumb: 'https://i.ytimg.com/vi/YQHsXMglC9A/mqdefault.jpg' },
  { id: 'pRpeEdMmmQ0', title: 'Waka Waka', channel: 'Shakira', thumb: 'https://i.ytimg.com/vi/pRpeEdMmmQ0/mqdefault.jpg' },
  { id: '60ItHLz5WEA', title: 'Faded', channel: 'Alan Walker', thumb: 'https://i.ytimg.com/vi/60ItHLz5WEA/mqdefault.jpg' },
  { id: '3AtDnEC4zak', title: 'We Dont Talk Anymore', channel: 'Charlie Puth', thumb: 'https://i.ytimg.com/vi/3AtDnEC4zak/mqdefault.jpg' },
  { id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', channel: 'Rick Astley', thumb: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg' },
  { id: 'JGwWNGJdvx8', title: 'Shape of You', channel: 'Ed Sheeran', thumb: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg' },
  { id: 'kTJczUoc26U', title: 'Starboy', channel: 'The Weeknd', thumb: 'https://i.ytimg.com/vi/kTJczUoc26U/mqdefault.jpg' },
  { id: 'RgKAFK5djSk', title: 'See You Again', channel: 'Wiz Khalifa', thumb: 'https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg' },
  { id: 'OPf0YbXqDm0', title: 'Uptown Funk', channel: 'Mark Ronson', thumb: 'https://i.ytimg.com/vi/OPf0YbXqDm0/mqdefault.jpg' },
  { id: 'hT_nvWreIhg', title: 'Counting Stars', channel: 'OneRepublic', thumb: 'https://i.ytimg.com/vi/hT_nvWreIhg/mqdefault.jpg' },
  { id: '09R8_2nJtjg', title: 'Sugar', channel: 'Maroon 5', thumb: 'https://i.ytimg.com/vi/09R8_2nJtjg/mqdefault.jpg' },
  { id: '60ItHLz5WEA', title: 'Faded', channel: 'Alan Walker', thumb: 'https://i.ytimg.com/vi/60ItHLz5WEA/mqdefault.jpg' }
];


let results = [...DEMO_TRACKS];
let currentIdx = -1;
let isPlaying = false;
let isMuted = false;
let isShuffle = false;
let isRepeat = false;
let progressTimer = null;
let elapsedSecs = 0;
let totalSecs = 0;
let currentVideoId = null;
let currentView = 'home';
let playlist = loadStore('hibiki_playlist', []);
let recent = loadStore('hibiki_recent', []);

function loadStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (e) {
    return fallback;
  }
}

function saveStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function fmt(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

function getApiKey() {
  return document.getElementById('apiKey').value.trim();
}

function escHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isSaved(track) {
  return playlist.some(item => item.id === track.id);
}

function renderResults(tracks) {
  const container = document.getElementById('results');
  const empty = document.getElementById('emptyState');
  const loading = document.getElementById('loadingState');

  loading.style.display = 'none';

  if (!tracks.length) {
    container.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';
  container.innerHTML = tracks.map((track, index) => {
    const isActive = track.id === currentVideoId;
    const saved = isSaved(track);
    const playedDate = track.playedAt ? `<div class="played-date">${escHtml(track.playedAt)}</div>` : '';

    return `
      <div class="result-item ${isActive ? 'active' : ''} ${isActive && isPlaying ? 'playing' : ''}">
        <div class="result-num">${index + 1}</div>
        <img class="result-thumb" src="${escHtml(track.thumb)}" alt="" loading="lazy" onerror="this.src=''" />
        <div class="result-info" onclick="selectTrack(${index})">
          <div class="result-title">${escHtml(track.title)}</div>
          <div class="result-channel">${escHtml(track.channel)}</div>
          ${playedDate}
        </div>
        <button class="save-track-btn ${saved ? 'saved' : ''}" onclick="togglePlaylistItem(${index})">
          ${saved ? '✓ Saved' : '+ Save'}
        </button>
        <div class="eq-bars"><span></span><span></span><span></span></div>
        <div class="result-play" onclick="selectTrack(${index})">▶</div>
      </div>`;
  }).join('');
}

async function doSearch() {
  const query = document.getElementById('searchInput').value.trim();
  const apiKey = getApiKey();

  if (!query) return;

  currentView = 'home';
  setActiveNav('home');
  document.getElementById('sectionTitle').textContent = `Results for "${query}"`;
  document.getElementById('results').innerHTML = '';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('loadingState').style.display = 'flex';

  if (!apiKey) {
    const filtered = DEMO_TRACKS.filter(track =>
      track.title.toLowerCase().includes(query.toLowerCase()) ||
      track.channel.toLowerCase().includes(query.toLowerCase())
    );

    results = filtered.length ? filtered : DEMO_TRACKS;
    currentIdx = -1;
    renderResults(results);
    return;
  }

  try {
    const url = 'https://www.googleapis.com/youtube/v3/search' +
      `?part=snippet&q=${encodeURIComponent(query)}&type=video` +
      `&videoCategoryId=10&maxResults=20&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      alert('YouTube API error. Demo songs will be shown instead.');
      results = [...DEMO_TRACKS];
      renderResults(results);
      return;
    }

    results = data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumb: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
    }));

    currentIdx = -1;
    renderResults(results);
  } catch (error) {
    console.error(error);
    results = [...DEMO_TRACKS];
    renderResults(results);
  }
}

function selectTrack(index) {
  currentIdx = index;
  const track = results[index];
  currentVideoId = track.id;

  document.getElementById('npTitle').textContent = track.title;
  document.getElementById('npChannel').textContent = track.channel;

  const npThumb = document.getElementById('npThumb');
  npThumb.src = track.thumb;
  npThumb.style.display = 'block';
  document.getElementById('npThumbPlaceholder').style.display = 'none';
  document.getElementById('openYtBtn').style.display = 'flex';

  addRecentlyPlayed(track);
  updateLikeButton(track);
  loadYouTube(track.id);
  renderResults(results);
}

function loadYouTube(videoId) {
  clearInterval(progressTimer);
  elapsedSecs = 0;
  isPlaying = true;

  document.getElementById('progressFill').style.width = '0%';
  document.getElementById('elapsed').textContent = '0:00';
  document.getElementById('duration').textContent = '...';

  const ytWrap = document.getElementById('ytContainer');
  ytWrap.innerHTML = `
    <iframe
      id="ytPlayer"
      width="1"
      height="1"
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen>
    </iframe>`;

  totalSecs = 200 + Math.floor(Math.random() * 120);
  document.getElementById('duration').textContent = fmt(totalSecs);
  updatePlayIcon();
  startProgress();
}

function startProgress() {
  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (!isPlaying) return;
    elapsedSecs++;

    if (elapsedSecs >= totalSecs) {
      clearInterval(progressTimer);
      if (isRepeat) {
        elapsedSecs = 0;
        startProgress();
      } else {
        skipNext();
      }
      return;
    }

    updateProgress();
  }, 1000);
}

function updateProgress() {
  const percent = totalSecs > 0 ? (elapsedSecs / totalSecs * 100).toFixed(2) : 0;
  document.getElementById('progressFill').style.width = percent + '%';
  document.getElementById('elapsed').textContent = fmt(elapsedSecs);
  document.getElementById('duration').textContent = fmt(totalSecs);
}

function togglePlay() {
  if (currentIdx === -1) return;
  isPlaying = !isPlaying;
  updatePlayIcon();
  renderResults(results);
}

function updatePlayIcon() {
  const icon = document.getElementById('playIcon');
  if (isPlaying) {
    icon.innerHTML = '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>';
  } else {
    icon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
  }
}

function skipNext() {
  if (!results.length) return;

  let nextIndex;
  if (isShuffle) {
    nextIndex = Math.floor(Math.random() * results.length);
  } else {
    nextIndex = (currentIdx + 1) % results.length;
  }

  selectTrack(nextIndex);
}

function skipPrev() {
  if (!results.length) return;
  const previousIndex = (currentIdx - 1 + results.length) % results.length;
  selectTrack(previousIndex);
}

function seekTo(event) {
  const bar = document.getElementById('progressBar');
  const rect = bar.getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  elapsedSecs = Math.floor(percent * totalSecs);
  updateProgress();
}

function setVolume(value) {
  const iframe = document.getElementById('ytPlayer');
  if (!iframe) return;

  iframe.contentWindow?.postMessage(JSON.stringify({
    event: 'command',
    func: 'setVolume',
    args: [parseInt(value)]
  }), '*');

  isMuted = Number(value) === 0;
  updateVolIcon();
}

function toggleMute() {
  isMuted = !isMuted;
  const slider = document.getElementById('volumeSlider');
  slider.value = isMuted ? 0 : 80;
  setVolume(slider.value);
  updateVolIcon();
}

function updateVolIcon() {
  const icon = document.getElementById('volIcon');
  if (isMuted) {
    icon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="1.8"></line>
      <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="1.8"></line>`;
  } else {
    icon.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"></path>`;
  }
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  document.getElementById('shuffleBtn').classList.toggle('active', isShuffle);
}

function toggleRepeat() {
  isRepeat = !isRepeat;
  document.getElementById('repeatBtn').classList.toggle('active', isRepeat);
}

function toggleLike() {
  if (currentIdx === -1 || !currentVideoId) return;
  const track = results[currentIdx];
  togglePlaylistTrack(track);
}

function togglePlaylistItem(index) {
  const track = results[index];
  togglePlaylistTrack(track);
}

function togglePlaylistTrack(track) {
  if (isSaved(track)) {
    playlist = playlist.filter(item => item.id !== track.id);
  } else {
    playlist.unshift({ id: track.id, title: track.title, channel: track.channel, thumb: track.thumb });
  }

  saveStore('hibiki_playlist', playlist);
  updateLikeButton(track);

  if (currentView === 'playlist') {
    results = [...playlist];
  }

  renderResults(results);
}

function updateLikeButton(track) {
  document.getElementById('likeBtn').classList.toggle('liked', isSaved(track));
}

function addRecentlyPlayed(track) {
  recent = recent.filter(item => item.id !== track.id);
  recent.unshift({
    id: track.id,
    title: track.title,
    channel: track.channel,
    thumb: track.thumb,
    playedAt: new Date().toLocaleString()
  });
  recent = recent.slice(0, 15);
  saveStore('hibiki_recent', recent);
}

function showView(view, button) {
  currentView = view;
  if (button) setActiveButton(button);
  else setActiveNav(view);

  if (view === 'home') {
    document.getElementById('sectionTitle').textContent = 'Featured tracks';
    results = [...DEMO_TRACKS];
  }

  if (view === 'playlist') {
    document.getElementById('sectionTitle').textContent = 'Saved playlist';
    results = [...playlist];
  }

  if (view === 'recent') {
    document.getElementById('sectionTitle').textContent = 'Recently played';
    results = [...recent];
  }

  currentIdx = results.findIndex(track => track.id === currentVideoId);
  renderResults(results);
}

function focusSearch(button) {
  setActiveButton(button);
  document.getElementById('searchInput').focus();
}

function setActiveButton(button) {
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  button.classList.add('active');
}

function setActiveNav(view) {
  const map = { home: 0, search: 1, playlist: 2, recent: 3 };
  const items = document.querySelectorAll('.nav-item');
  items.forEach(item => item.classList.remove('active'));
  if (items[map[view]]) items[map[view]].classList.add('active');
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
  applyTheme(nextTheme);
  localStorage.setItem('hibiki_theme', nextTheme);
}

function applyTheme(theme) {
  const light = theme === 'light';
  document.body.classList.toggle('light-mode', light);

  const themeBtn = document.getElementById('themeBtn');
  const themeText = document.getElementById('themeNavText');

  if (themeBtn) themeBtn.textContent = light ? '☀️ Light' : '🌙 Dark';
  if (themeText) themeText.textContent = light ? 'Light Mode' : 'Dark Mode';
}

function openInYoutube() {
  if (!currentVideoId) return;
  window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank');
}

document.addEventListener('keydown', event => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;

  if (event.code === 'Space') {
    event.preventDefault();
    togglePlay();
  }

  if (event.code === 'ArrowRight') skipNext();
  if (event.code === 'ArrowLeft') skipPrev();
  if (event.code === 'KeyM') toggleMute();
});

document.getElementById('searchInput').addEventListener('keydown', event => {
  if (event.key === 'Enter') doSearch();
});

document.getElementById('apiKey').addEventListener('input', function () {
  const value = this.value.trim();
  if (value) localStorage.setItem('hibiki_api_key', value);
  else localStorage.removeItem('hibiki_api_key');
});

const savedKey = localStorage.getItem('hibiki_api_key');
if (savedKey) {
  const keyInput = document.getElementById('apiKey');
  keyInput.value = savedKey;
  keyInput.placeholder = 'API key loaded!';
  keyInput.style.color = '#5dcaa5';
}

applyTheme(localStorage.getItem('hibiki_theme') || 'dark');
renderResults(DEMO_TRACKS);

/* =========================================================
   Hibiki 響 — Clean Music Player JavaScript
   Main features:
   1. Demo music list
   2. YouTube search with optional API key
   3. Playlist and recently played using localStorage
   4. Play / pause / mute / volume controls
   5. Dark and light mode

   Important note:
   YouTube iframe ads are controlled by YouTube. This app can pause/play
   the iframe, but it cannot remove YouTube ads.
   ========================================================= */

// ---------- Demo tracks ----------
// Removed duplicate songs to keep the UI clean.
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
  { id: '3AtDnEC4zak', title: 'We Don\'t Talk Anymore', channel: 'Charlie Puth', thumb: 'https://i.ytimg.com/vi/3AtDnEC4zak/mqdefault.jpg' }
];

// ---------- App state ----------
let results = [...DEMO_TRACKS];
let currentIdx = -1;
let currentVideoId = null;
let currentView = 'home';

let isPlaying = false;
let isMuted = false;
let isShuffle = false;
let isRepeat = false;

let progressTimer = null;
let elapsedSecs = 0;
let totalSecs = 0;

let playlist = loadStore('hibiki_playlist', []);
let recent = loadStore('hibiki_recent', []);

// ---------- DOM shortcuts ----------
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ---------- localStorage helpers ----------
function loadStore(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (error) {
    console.warn(`Could not load ${key}`, error);
    return fallback;
  }
}

function saveStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Utility helpers ----------
function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  return Math.floor(safeSeconds / 60) + ':' + String(safeSeconds % 60).padStart(2, '0');
}

function escapeHtml(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getApiKey() {
  return $('#apiKey').value.trim();
}

function isSaved(track) {
  return playlist.some((item) => item.id === track.id);
}

// ---------- Rendering ----------
function renderResults(tracks) {
  const container = $('#results');
  const empty = $('#emptyState');
  const loading = $('#loadingState');

  loading.hidden = true;

  if (!tracks.length) {
    container.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  container.innerHTML = tracks.map((track, index) => {
    const active = track.id === currentVideoId;
    const saved = isSaved(track);
    const playedDate = track.playedAt
      ? `<div class="played-date">${escapeHtml(track.playedAt)}</div>`
      : '';

    return `
      <div class="result-item ${active ? 'active' : ''}">
        <div class="result-num">${index + 1}</div>
        <img class="result-thumb" src="${escapeHtml(track.thumb)}" alt="" loading="lazy" />
        <div class="result-info" data-index="${index}">
          <div class="result-title">${escapeHtml(track.title)}</div>
          <div class="result-channel">${escapeHtml(track.channel)}</div>
          ${playedDate}
        </div>
        <button class="save-track-btn ${saved ? 'saved' : ''}" data-save-index="${index}" type="button">
          ${saved ? '✓ Saved' : '+ Save'}
        </button>
        <div class="result-play" data-index="${index}">${active && isPlaying ? '❚❚' : '▶'}</div>
      </div>`;
  }).join('');
}

function updateNowPlaying(track) {
  $('#npTitle').textContent = track.title;
  $('#npChannel').textContent = track.channel;

  $('#npThumb').src = track.thumb;
  $('#npThumb').style.display = 'block';
  $('#npThumbPlaceholder').style.display = 'none';

  $('#openYtBtn').hidden = false;
  updateLikeButton(track);
}

function updateLikeButton(track) {
  $('#likeBtn').classList.toggle('liked', isSaved(track));
  $('#likeBtn').textContent = isSaved(track) ? '♥' : '♡';
}

// ---------- YouTube iframe control ----------
function sendYouTubeCommand(command, args = []) {
  const iframe = $('#ytPlayer');
  if (!iframe || !iframe.contentWindow) return;

  iframe.contentWindow.postMessage(JSON.stringify({
    event: 'command',
    func: command,
    args
  }), '*');
}

function loadYouTube(videoId) {
  clearInterval(progressTimer);

  elapsedSecs = 0;
  totalSecs = 200 + Math.floor(Math.random() * 120); // Demo duration only
  isPlaying = true;

  $('#progressFill').style.width = '0%';
  $('#elapsed').textContent = '0:00';
  $('#duration').textContent = formatTime(totalSecs);

  // autoplay=1 starts the selected video. enablejsapi=1 allows pause/play control.
  $('#ytContainer').innerHTML = `
    <iframe
      id="ytPlayer"
      width="1"
      height="1"
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen>
    </iframe>`;

  updatePlayButton();
  startProgressTimer();
}

function pauseYouTube() {
  sendYouTubeCommand('pauseVideo');
}

function playYouTube() {
  sendYouTubeCommand('playVideo');
}

// ---------- Player controls ----------
function selectTrack(index) {
  const track = results[index];
  if (!track) return;

  currentIdx = index;
  currentVideoId = track.id;

  updateNowPlaying(track);
  addRecentlyPlayed(track);
  loadYouTube(track.id);
  renderResults(results);
}

function togglePlay() {
  if (currentIdx === -1) return;

  isPlaying = !isPlaying;

  // This is the important fix: the iframe is now really paused or played.
  if (isPlaying) {
    playYouTube();
    startProgressTimer();
  } else {
    pauseYouTube();
    clearInterval(progressTimer);
  }

  updatePlayButton();
  renderResults(results);
}

function updatePlayButton() {
  $('#playBtn').textContent = isPlaying ? '❚❚' : '▶';
}

function skipNext() {
  if (!results.length) return;

  const nextIndex = isShuffle
    ? Math.floor(Math.random() * results.length)
    : (currentIdx + 1) % results.length;

  selectTrack(nextIndex);
}

function skipPrev() {
  if (!results.length) return;
  selectTrack((currentIdx - 1 + results.length) % results.length);
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  $('#shuffleBtn').classList.toggle('active', isShuffle);
}

function toggleRepeat() {
  isRepeat = !isRepeat;
  $('#repeatBtn').classList.toggle('active', isRepeat);
}

function toggleMute() {
  isMuted = !isMuted;
  $('#volumeSlider').value = isMuted ? 0 : 80;
  setVolume($('#volumeSlider').value);
}

function setVolume(value) {
  sendYouTubeCommand('setVolume', [Number(value)]);
  isMuted = Number(value) === 0;
  $('#muteBtn').textContent = isMuted ? '🔇' : '🔊';
}

function seekTo(event) {
  if (!totalSecs) return;

  const rect = $('#progressBar').getBoundingClientRect();
  const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));

  elapsedSecs = Math.floor(percent * totalSecs);
  updateProgressUI();

  // The demo timer moves, but true YouTube seek needs the official iframe API.
  sendYouTubeCommand('seekTo', [elapsedSecs, true]);
}

function startProgressTimer() {
  clearInterval(progressTimer);

  progressTimer = setInterval(() => {
    if (!isPlaying) return;

    elapsedSecs += 1;

    if (elapsedSecs >= totalSecs) {
      clearInterval(progressTimer);
      if (isRepeat) selectTrack(currentIdx);
      else skipNext();
      return;
    }

    updateProgressUI();
  }, 1000);
}

function updateProgressUI() {
  const percent = totalSecs > 0 ? (elapsedSecs / totalSecs) * 100 : 0;
  $('#progressFill').style.width = `${percent}%`;
  $('#elapsed').textContent = formatTime(elapsedSecs);
  $('#duration').textContent = formatTime(totalSecs);
}

// ---------- Search ----------
async function doSearch() {
  const query = $('#searchInput').value.trim();
  const apiKey = getApiKey();

  if (!query) return;

  currentView = 'home';
  setActiveNav('home');
  $('#sectionTitle').textContent = `Results for "${query}"`;
  $('#results').innerHTML = '';
  $('#emptyState').hidden = true;
  $('#loadingState').hidden = false;

  // Demo search is used when no API key is provided.
  if (!apiKey) {
    const lowerQuery = query.toLowerCase();
    const filtered = DEMO_TRACKS.filter((track) =>
      track.title.toLowerCase().includes(lowerQuery) ||
      track.channel.toLowerCase().includes(lowerQuery)
    );

    results = filtered.length ? filtered : DEMO_TRACKS;
    currentIdx = -1;
    renderResults(results);
    return;
  }

  try {
    const url = 'https://www.googleapis.com/youtube/v3/search' +
      `?part=snippet&q=${encodeURIComponent(query)}&type=video` +
      `&videoCategoryId=10&maxResults=20&key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      alert('YouTube API error. Demo songs will be shown instead.');
      results = [...DEMO_TRACKS];
      renderResults(results);
      return;
    }

    results = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumb: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || ''
    }));

    currentIdx = -1;
    renderResults(results);
  } catch (error) {
    console.error('Search failed:', error);
    alert('Search failed. Demo songs will be shown instead.');
    results = [...DEMO_TRACKS];
    renderResults(results);
  }
}

// ---------- Playlist and recent ----------
function toggleLike() {
  if (currentIdx === -1) return;
  togglePlaylistTrack(results[currentIdx]);
}

function togglePlaylistItem(index) {
  const track = results[index];
  if (track) togglePlaylistTrack(track);
}

function togglePlaylistTrack(track) {
  if (isSaved(track)) {
    playlist = playlist.filter((item) => item.id !== track.id);
  } else {
    playlist.unshift({ id: track.id, title: track.title, channel: track.channel, thumb: track.thumb });
  }

  saveStore('hibiki_playlist', playlist);
  updateLikeButton(track);

  if (currentView === 'playlist') {
    results = [...playlist];
    currentIdx = results.findIndex((item) => item.id === currentVideoId);
  }

  renderResults(results);
}

function addRecentlyPlayed(track) {
  recent = recent.filter((item) => item.id !== track.id);
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

// ---------- Views and theme ----------
function showView(view) {
  currentView = view;
  setActiveNav(view);

  if (view === 'home') {
    $('#sectionTitle').textContent = 'Featured tracks';
    results = [...DEMO_TRACKS];
  } else if (view === 'playlist') {
    $('#sectionTitle').textContent = 'Saved playlist';
    results = [...playlist];
  } else if (view === 'recent') {
    $('#sectionTitle').textContent = 'Recently played';
    results = [...recent];
  }

  currentIdx = results.findIndex((track) => track.id === currentVideoId);
  renderResults(results);
}

function setActiveNav(view) {
  $$('.nav-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.view === view);
  });
}

function focusSearch() {
  $$('.nav-item').forEach((item) => item.classList.remove('active'));
  $('[data-action="search"]').classList.add('active');
  $('#searchInput').focus();
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
  applyTheme(nextTheme);
  localStorage.setItem('hibiki_theme', nextTheme);
}

function applyTheme(theme) {
  const light = theme === 'light';
  document.body.classList.toggle('light-mode', light);
  $('#themeBtn').textContent = light ? '☀️ Light' : '🌙 Dark';
}

function openInYoutube() {
  if (!currentVideoId) return;
  window.open(`https://www.youtube.com/watch?v=${currentVideoId}`, '_blank', 'noopener,noreferrer');
}

// ---------- API key handling ----------
function saveApiKey(value) {
  if (value) localStorage.setItem('hibiki_api_key', value);
  else localStorage.removeItem('hibiki_api_key');
}

function forgetApiKey() {
  localStorage.removeItem('hibiki_api_key');
  $('#apiKey').value = '';
  $('#apiKey').placeholder = 'Optional: paste YouTube API key for real search';
}

function loadSavedApiKey() {
  const savedKey = localStorage.getItem('hibiki_api_key');
  if (!savedKey) return;

  $('#apiKey').value = savedKey;
  $('#apiKey').placeholder = 'API key loaded from this browser';
}

// ---------- Event listeners ----------
function bindEvents() {
  $('#searchBtn').addEventListener('click', doSearch);
  $('#themeBtn').addEventListener('click', toggleTheme);
  $('#likeBtn').addEventListener('click', toggleLike);
  $('#playBtn').addEventListener('click', togglePlay);
  $('#nextBtn').addEventListener('click', skipNext);
  $('#prevBtn').addEventListener('click', skipPrev);
  $('#shuffleBtn').addEventListener('click', toggleShuffle);
  $('#repeatBtn').addEventListener('click', toggleRepeat);
  $('#muteBtn').addEventListener('click', toggleMute);
  $('#progressBar').addEventListener('click', seekTo);
  $('#openYtBtn').addEventListener('click', openInYoutube);
  $('#forgetApiKeyBtn').addEventListener('click', forgetApiKey);

  $('#volumeSlider').addEventListener('input', (event) => setVolume(event.target.value));
  $('#apiKey').addEventListener('input', (event) => saveApiKey(event.target.value.trim()));

  $('#searchInput').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') doSearch();
  });

  $$('.nav-item[data-view]').forEach((button) => {
    button.addEventListener('click', () => showView(button.dataset.view));
  });

  $('[data-action="search"]').addEventListener('click', focusSearch);

  // Event delegation for result list buttons.
  $('#results').addEventListener('click', (event) => {
    const playTarget = event.target.closest('[data-index]');
    const saveTarget = event.target.closest('[data-save-index]');

    if (saveTarget) {
      togglePlaylistItem(Number(saveTarget.dataset.saveIndex));
      return;
    }

    if (playTarget) {
      selectTrack(Number(playTarget.dataset.index));
    }
  });

  // Keyboard shortcuts.
  document.addEventListener('keydown', (event) => {
    const tag = document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    if (event.code === 'Space') {
      event.preventDefault();
      togglePlay();
    } else if (event.code === 'ArrowRight') {
      skipNext();
    } else if (event.code === 'ArrowLeft') {
      skipPrev();
    } else if (event.code === 'KeyM') {
      toggleMute();
    }
  });
}

// ---------- Start app ----------
function init() {
  bindEvents();
  loadSavedApiKey();
  applyTheme(localStorage.getItem('hibiki_theme') || 'dark');
  renderResults(DEMO_TRACKS);
}

init();

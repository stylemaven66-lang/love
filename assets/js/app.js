import { locations, dialogueByLocation } from './dialogues.js';
import { playlist } from './playlist.js';

// Elements
const sceneEl = document.getElementById('scene');
const toolbarEl = document.getElementById('toolbar');
const dialoguesEl = document.getElementById('dialogues');
const moluEl = document.getElementById('molu');
const goluEl = document.getElementById('golu');
const nextBtn = document.getElementById('nextLine');
const musicContainer = document.getElementById('musicSpot');
const audioEl = document.getElementById('audio');
const titleEl = document.getElementById('title');
const artistEl = document.getElementById('artist');
const playBtn = document.getElementById('play');
const prevBtn = document.getElementById('prev');
const nextTrackBtn = document.getElementById('next');
const visualizer = document.getElementById('visualizer');
const playlistEl = document.getElementById('playlist');

// Stars
const starsContainer = document.getElementById('stars');
if (starsContainer) {
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        starsContainer.appendChild(star);
    }
}

// Build toolbar buttons
let currentLocation = 'garden';
let currentLineIdx = 0;

locations.forEach(loc => {
    const btn = document.createElement('button');
    btn.textContent = loc.label;
    btn.dataset.loc = loc.id;
    btn.className = loc.id === currentLocation ? 'active' : '';
    btn.addEventListener('click', () => switchLocation(loc.id));
    toolbarEl.appendChild(btn);
});

function switchLocation(loc) {
    currentLocation = loc;
    currentLineIdx = 0;
    Array.from(toolbarEl.querySelectorAll('button')).forEach(b => b.classList.toggle('active', b.dataset.loc === loc));
    sceneEl.className = 'scene ' + loc;
    renderLine();
}

function renderLine() {
    dialoguesEl.innerHTML = '';
    const lines = dialogueByLocation[currentLocation] || [];
    const line = lines[currentLineIdx % Math.max(1, lines.length)] || '';

    if (line) {
        const moluBubble = document.createElement('div');
        moluBubble.className = 'bubble molu';
        moluBubble.textContent = line;

        const goluBubble = document.createElement('div');
        goluBubble.className = 'bubble golu';
        goluBubble.textContent = '💕 I love you too, Molu!';

        dialoguesEl.appendChild(moluBubble);
        dialoguesEl.appendChild(goluBubble);
    }
}

nextBtn.addEventListener('click', () => {
    currentLineIdx++;
    renderLine();
    pulse(moluEl);
});

moluEl.addEventListener('click', () => {
    currentLineIdx++;
    renderLine();
    pulse(moluEl);
});

goluEl.addEventListener('click', () => {
    sparkleAt(goluEl);
});

function pulse(el) {
    el.style.transform = 'scale(1.04)';
    setTimeout(() => { el.style.transform = ''; }, 180);
}

function sparkleAt(el) {
    const s = document.createElement('div');
    s.style.position = 'absolute';
    s.style.width = '10px';
    s.style.height = '10px';
    s.style.borderRadius = '50%';
    s.style.background = 'radial-gradient(circle, #ffd1dc, rgba(255,255,255,0))';
    s.style.left = (el.offsetLeft + el.clientWidth/2) + 'px';
    s.style.top = (el.offsetTop + 10) + 'px';
    s.style.pointerEvents = 'none';
    s.style.zIndex = 5;
    sceneEl.appendChild(s);
    s.animate([
        { transform: 'translate(-50%, 0) scale(0.6)', opacity: 1 },
        { transform: 'translate(-50%, -60px) scale(1.8)', opacity: 0 }
    ], { duration: 600, easing: 'ease-out' }).onfinish = () => s.remove();
}

// Music Player
let currentTrackIdx = 0;
let audioCtx, analyser, sourceNode;

function loadTrack(idx) {
    currentTrackIdx = (idx + playlist.length) % playlist.length;
    const track = playlist[currentTrackIdx];
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    audioEl.src = track.src;
    Array.from(playlistEl.children).forEach((c, i) => c.classList.toggle('active', i === currentTrackIdx));
}

function togglePlay() {
    if (audioEl.paused) {
        audioEl.play();
    } else {
        audioEl.pause();
    }
}

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => { loadTrack(currentTrackIdx - 1); audioEl.play(); });
nextTrackBtn.addEventListener('click', () => { loadTrack(currentTrackIdx + 1); audioEl.play(); });
audioEl.addEventListener('ended', () => { loadTrack(currentTrackIdx + 1); audioEl.play(); });

// Build playlist UI
playlist.forEach((t, i) => {
    const card = document.createElement('div');
    card.className = 'track';
    card.innerHTML = `<div class="t">${t.title}</div><div class="a">${t.artist}</div>`;
    card.addEventListener('click', () => { loadTrack(i); audioEl.play(); });
    playlistEl.appendChild(card);
});

// Visualizer
const ctx = visualizer.getContext('2d');
function initAudioGraph() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    sourceNode = audioCtx.createMediaElementSource(audioEl);
    sourceNode.connect(analyser);
    analyser.connect(audioCtx.destination);
}

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    if (!analyser) return;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    const { width, height } = visualizer;
    ctx.clearRect(0, 0, width, height);
    const barWidth = (width / bufferLength) * 1.5;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 255;
        const barHeight = v * height;
        ctx.fillStyle = `hsl(${280 - i}, 80%, ${40 + v * 40}%)`;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
    }
}

document.addEventListener('click', () => initAudioGraph(), { once: true });
drawVisualizer();

// Init
switchLocation(currentLocation);
loadTrack(0);


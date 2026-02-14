const WS_URL = "ws://localhost:8000/ws/audio";
const SAMPLE_RATE = 16000;
const CHUNK_SECONDS = 1.5;
const CHUNK_SAMPLES = Math.floor(SAMPLE_RATE * CHUNK_SECONDS);

const gaugeArc = document.getElementById("gaugeArc");
const gaugeValue = document.getElementById("gaugeValue");
const latencyEl = document.getElementById("latency");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const levelFill = document.getElementById("levelFill");
const canvas = document.getElementById("wave");
const ctx = canvas.getContext("2d");
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");

let audioCtx;
let sourceNode;
let analyser;
let processor;
let ws;
let buffer = new Float32Array(0);
let running = false;

let gaugeDisplayed = 0.0;
let gaugeTarget = 0.0;
const R = 86;
const CIRC = 2 * Math.PI * R * 1.0;
gaugeArc.style.strokeDasharray = `${CIRC}`;
gaugeArc.style.strokeDashoffset = `${CIRC}`;

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(x, lo=0, hi=1) { return Math.max(lo, Math.min(hi, x)); }

function setStatus(online) {
  if (online) {
    statusDot.classList.add("online");
    statusText.textContent = "Connected";
  } else {
    statusDot.classList.remove("online");
    statusText.textContent = "Disconnected";
  }
}

function updateThemeByLevel(level) {
  const body = document.body;
  body.classList.remove("green","yellow","red");
  if (level === "RED") body.classList.add("red");
  else if (level === "YELLOW") body.classList.add("yellow");
  else body.classList.add("green");
}

function animateGauge() {
  gaugeDisplayed = lerp(gaugeDisplayed, gaugeTarget, 0.08);
  const offset = CIRC * (1 - clamp(gaugeDisplayed, 0, 1));
  gaugeArc.style.strokeDashoffset = `${offset}`;
  gaugeValue.textContent = `${Math.round(gaugeDisplayed * 100)}%`;
  requestAnimationFrame(animateGauge);
}

function drawWave() {
  if (!analyser) {
    requestAnimationFrame(drawWave);
    return;
  }
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0,0,w,h);
  const data = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(data);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(180,220,255,0.9)";
  ctx.beginPath();
  const step = Math.ceil(data.length / w);
  for (let x=0; x<w; x++) {
    let sum = 0;
    for (let i=0;i<step;i++) {
      const idx = x*step + i;
      if (idx < data.length) sum += data[idx];
    }
    const v = (sum/step) * 0.5 + 0.5;
    const y = (1 - v) * h;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  let rms = 0;
  for (let i=0;i<data.length;i++) rms += data[i]*data[i];
  rms = Math.sqrt(rms / data.length);
  levelFill.style.width = `${Math.min(100, Math.max(0, rms*120))}%`;
  requestAnimationFrame(drawWave);
}

function downmixToMono(input) {
  if (input.numberOfChannels === 1) return input.getChannelData(0);
  const ch0 = input.getChannelData(0);
  const ch1 = input.getChannelData(1);
  const out = new Float32Array(input.length);
  for (let i=0;i<input.length;i++) out[i] = 0.5*(ch0[i] + ch1[i]);
  return out;
}

function appendBuffer(a, b) {
  const out = new Float32Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function ensureWS() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  ws = new WebSocket(WS_URL);
  ws.binaryType = "arraybuffer";
  ws.onopen = () => setStatus(true);
  ws.onclose = () => setStatus(false);
  ws.onerror = () => setStatus(false);
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (typeof msg.risk === "number") {
        gaugeTarget = msg.risk;
        updateThemeByLevel(msg.level || "GREEN");
      }
      if (typeof msg.latency_ms === "number") {
        latencyEl.textContent = `${msg.latency_ms.toFixed(1)} ms`;
      }
    } catch {}
  };
}

async function start() {
  if (running) return;
  running = true;
  ensureWS();
  audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SAMPLE_RATE });
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
  sourceNode = audioCtx.createMediaStreamSource(stream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  processor = audioCtx.createScriptProcessor(4096, 1, 1);
  sourceNode.connect(analyser);
  analyser.connect(processor);
  processor.connect(audioCtx.destination);
  buffer = new Float32Array(0);
  processor.onaudioprocess = (e) => {
    if (!running) return;
    const input = e.inputBuffer;
    const mono = downmixToMono(input);
    buffer = appendBuffer(buffer, mono);
    while (buffer.length >= CHUNK_SAMPLES) {
      const chunk = buffer.subarray(0, CHUNK_SAMPLES);
      buffer = buffer.subarray(CHUNK_SAMPLES);
      if (ws && ws.readyState === WebSocket.OPEN) {
        const ab = new Float32Array(chunk).buffer;
        ws.send(ab);
      }
    }
  };
}

function stop() {
  running = false;
  try { processor && processor.disconnect(); } catch {}
  try { analyser && analyser.disconnect(); } catch {}
  try { sourceNode && sourceNode.disconnect(); } catch {}
  try { audioCtx && audioCtx.close(); } catch {}
}

btnStart.addEventListener("click", start);
btnStop.addEventListener("click", stop);

requestAnimationFrame(animateGauge);
requestAnimationFrame(drawWave);

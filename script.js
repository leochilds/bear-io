const button = document.getElementById('bear-button');
const statusEl = document.getElementById('status');
const pseudoItems = Array.from(document.querySelectorAll('.pseudocode li'));
const flowNodes = Array.from(document.querySelectorAll('.flow-node'));

const STEP_CONFIG = [
  {
    pseudoId: 'pseudo-handle',
    nodeId: 'node-handle',
    message: 'Event handler executes the program logic.',
    duration: 900,
  },
  {
    pseudoId: 'pseudo-flow',
    nodeId: 'node-flow',
    message: 'Program updates the flow diagram and prepares the sound.',
    duration: 900,
  },
  {
    pseudoId: 'pseudo-sound',
    nodeId: 'node-sound',
    message: 'Output stage: bear sound plays!',
    duration: 1200,
    action: playBearSound,
  },
  {
    pseudoId: 'pseudo-done',
    nodeId: null,
    message: 'Program resets and waits for the next interaction.',
    duration: 900,
  },
];

let audioCtx;
let bearBufferPromise;
let timers = [];

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function loadBearBuffer() {
  if (!bearBufferPromise) {
    bearBufferPromise = fetch('sound.wav')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load sound asset');
        }
        return response.arrayBuffer();
      })
      .then((arrayBuffer) => getAudioContext().decodeAudioData(arrayBuffer));
  }
  return bearBufferPromise;
}

function playBearSound() {
  const ctx = getAudioContext();
  loadBearBuffer()
    .then((buffer) => {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    })
    .catch(() => {
      // Ignore playback errors so the demo continues smoothly
    });
}

function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {
      // ignore resume errors triggered by rapid replays
    });
  }
}

function clearTimers() {
  timers.forEach((id) => clearTimeout(id));
  timers = [];
}

function setPseudoState(id, state) {
  const el = document.getElementById(id);
  if (!el) return;
  if (state === 'active') {
    pseudoItems.forEach((item) => item.classList.remove('active'));
    el.classList.add('active');
  } else if (state === 'completed') {
    el.classList.remove('active');
    el.classList.add('completed');
  } else if (state === 'reset') {
    el.classList.remove('active', 'completed');
  }
}

function setFlowNodeState(id, state) {
  if (!id) return;
  const el = document.getElementById(id);
  if (!el) return;
  if (state === 'active') {
    flowNodes.forEach((node) => node.classList.remove('active'));
    el.classList.add('active');
  } else if (state === 'completed') {
    el.classList.remove('active');
    el.classList.add('completed');
  } else if (state === 'reset') {
    el.classList.remove('active', 'completed');
  }
}

function resetVisualState() {
  clearTimers();
  pseudoItems.forEach((item) => item.classList.remove('active', 'completed'));
  flowNodes.forEach((node) => node.classList.remove('active', 'completed'));
  setPseudoState('pseudo-wait', 'active');
  statusEl.textContent = 'Press the button to start the program.';
  button.disabled = false;
}

function runFlow(index = 0) {
  if (index >= STEP_CONFIG.length) {
    statusEl.textContent = 'Program finished this cycle. Resetting to wait for the next input.';
    const resetId = setTimeout(resetVisualState, 1200);
    timers.push(resetId);
    return;
  }

  const step = STEP_CONFIG[index];
  setPseudoState(step.pseudoId, 'active');
  setFlowNodeState(step.nodeId, 'active');
  statusEl.textContent = step.message;

  if (typeof step.action === 'function') {
    step.action();
  }

  const timeoutId = setTimeout(() => {
    setPseudoState(step.pseudoId, 'completed');
    setFlowNodeState(step.nodeId, 'completed');
    runFlow(index + 1);
  }, step.duration);

  timers.push(timeoutId);
}

button.addEventListener('click', () => {
  unlockAudioContext();
  clearTimers();
  button.disabled = true;

  pseudoItems.forEach((item) => item.classList.remove('active', 'completed'));
  flowNodes.forEach((node) => node.classList.remove('active', 'completed'));

  setPseudoState('pseudo-wait', 'completed');
  setFlowNodeState('node-wait', 'active');
  statusEl.textContent = 'Input detected: the button press travels into the program.';

  const waitId = setTimeout(() => {
    setFlowNodeState('node-wait', 'completed');
    runFlow();
  }, 700);

  timers.push(waitId);
});

resetVisualState();

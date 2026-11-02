// 버튼 클릭 효과음: 레트로 게임기 같은 짧은 "띠링" 소리를 코드로 만들어 재생

const VOLUME = 0.15; // 소리 크기 (0 ~ 1)
const NOTES = [
  { freq: 880, delay: 0 }, // 첫 음 (높을수록 높은 소리)
  { freq: 1320, delay: 0.07 }, // 두 번째 음 (0.07초 뒤)
];
const NOTE_LENGTH = 0.12; // 음 하나의 길이 (초)

let ctx: AudioContext | null = null;

function getContext() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 대화 타이핑 효과음: 글자가 나올 때마다 짧고 작은 "톡" 소리 (높이가 조금씩 달라짐)
const TYPE_VOLUME = 0.06; // 소리 크기 (0 ~ 1)
const TYPE_LENGTH = 0.04; // 소리 길이 (초)

export function playTypeSound() {
  const ctx = getContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle'; // 세모 파형 = 부드러운 소리
  osc.frequency.value = 650 + Math.random() * 200; // 650~850 사이에서 매번 조금씩 다르게
  gain.gain.setValueAtTime(TYPE_VOLUME, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + TYPE_LENGTH);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + TYPE_LENGTH);
}

export function playClickSound() {
  const ctx = getContext();
  const now = ctx.currentTime;

  for (const { freq, delay } of NOTES) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square'; // 네모 파형 = 옛날 게임기 소리
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(VOLUME, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + NOTE_LENGTH);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + NOTE_LENGTH);
  }
}

// 라운드 클리어 효과음: "도-미-솔-높은 도" 빠르게 올라가는 레트로 팡파레
const CLEAR_VOLUME = 0.12; // 소리 크기 (0 ~ 1)
const CLEAR_NOTES = [
  { freq: 523, delay: 0, length: 0.12 }, // 도
  { freq: 659, delay: 0.1, length: 0.12 }, // 미
  { freq: 784, delay: 0.2, length: 0.12 }, // 솔
  { freq: 1047, delay: 0.3, length: 0.45 }, // 높은 도 (길게)
];

export function playClearSound() {
  const ctx = getContext();
  const now = ctx.currentTime;
  for (const { freq, delay, length } of CLEAR_NOTES) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(CLEAR_VOLUME, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + length);
  }
}

// 짝 맞춤 효과음: 짧고 높은 "띠딩" 두 음
const MATCH_VOLUME = 0.1; // 소리 크기 (0 ~ 1)
const MATCH_NOTES = [
  { freq: 1047, delay: 0 }, // 높은 도
  { freq: 1568, delay: 0.06 }, // 높은 솔
];
const MATCH_LENGTH = 0.1; // 음 하나의 길이 (초)

export function playMatchSound() {
  const ctx = getContext();
  const now = ctx.currentTime;
  for (const { freq, delay } of MATCH_NOTES) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(MATCH_VOLUME, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + MATCH_LENGTH);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + MATCH_LENGTH);
  }
}

// 점프 효과음: 음이 아래에서 위로 쭉 올라가는 "뿅" (더블 점프는 더 높은 음)
const JUMP_VOLUME = 0.08; // 소리 크기 (0 ~ 1)
const JUMP_LENGTH = 0.15; // 소리 길이 (초)

export function playJumpSound(isDouble = false) {
  const ctx = getContext();
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = isDouble ? 500 : 300; // 시작 음 높이
  osc.type = 'square';
  osc.frequency.setValueAtTime(start, now);
  osc.frequency.exponentialRampToValueAtTime(start * 2.2, now + JUMP_LENGTH);
  gain.gain.setValueAtTime(JUMP_VOLUME, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + JUMP_LENGTH);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + JUMP_LENGTH);
}

// 옷 고르기 효과음: 높은 음이 빠르게 올라가는 반짝이는 "뾰로롱" (부드러운 세모 파형)
const PICK_VOLUME = 0.09; // 소리 크기 (0 ~ 1)
const PICK_NOTES = [1319, 1568, 1976, 2637]; // 미-솔-시-높은 미
const PICK_GAP = 0.045; // 음 사이 간격 (초)
const PICK_LENGTH = 0.18; // 음 하나의 길이 (초)

export function playPickSound() {
  const ctx = getContext();
  const now = ctx.currentTime;
  PICK_NOTES.forEach((freq, i) => {
    const t = now + i * PICK_GAP;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(PICK_VOLUME, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + PICK_LENGTH);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + PICK_LENGTH);
  });
}

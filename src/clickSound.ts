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

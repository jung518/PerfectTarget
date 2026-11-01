// 버튼 클릭 효과음: 레트로 게임기 같은 짧은 "띠링" 소리를 코드로 만들어 재생

const VOLUME = 0.15; // 소리 크기 (0 ~ 1)
const NOTES = [
  { freq: 880, delay: 0 }, // 첫 음 (높을수록 높은 소리)
  { freq: 1320, delay: 0.07 }, // 두 번째 음 (0.07초 뒤)
];
const NOTE_LENGTH = 0.12; // 음 하나의 길이 (초)

let ctx: AudioContext | null = null;

export function playClickSound() {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
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

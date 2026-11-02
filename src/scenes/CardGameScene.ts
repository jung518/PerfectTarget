import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox';
import { addBackButton } from '../ui/backButton';
import { createGuideDialogue, showGuide } from '../ui/guide';
import { playClearSound, playMatchSound } from '../clickSound';

// ───────── 설정 ─────────
// (캐릭터·말풍선 위치와 배경 흐림 정도는 src/ui/guide.ts에서 바꿈)

// 대사 (한 줄 = 말풍선 한 번)
const ROUND1_GUIDE = [
  '첫 번째 게임은 카드 짝 맞추기야!',
  '카드를 두 장씩 뒤집어서\n같은 그림을 찾으면 짝이 맞춰져.',
  '처음에 카드를 잠깐 보여 줄게.\n잘 기억해 둬!',
  '그럼 시작해 볼까?',
];
const ROUND2_GUIDE = [
  '1라운드 클리어! 완전 쉽지?',
  '2라운드는 카드가 12장으로 늘어나.',
  '이번에도 처음에 잠깐 보여 줄 테니까\n집중해서 기억해 봐!',
];
// 시간이 다 됐을 때 (다시 도전)
const RETRY_GUIDE = [
  '앗, 시간이 다 됐어!',
  '아쉬우니까 기회를 한 번 더 줄게.\n이번엔 꼭 성공하길~..',
];

// 시간 막대 (화면 위쪽 가운데)
const TIMER_X = 811; // 막대 가운데 가로 위치
const TIMER_Y = 60; // 막대 가운데 세로 위치
const TIMER_WIDTH = 340; // 막대 가로
const TIMER_HEIGHT = 30; // 막대 세로
const TIMER_WARNING = 5000; // 남은 시간이 이보다 적으면 빨갛게 깜빡임 (1000 = 1초)

// 카드 공통
const BOARD_CENTER_Y = 470; // 카드 판 가운데 세로 위치
const MISMATCH_DELAY = 700; // 짝이 틀렸을 때 다시 뒤집기까지 기다리는 시간
const FLIP_TIME = 120; // 카드가 반쯤 뒤집히는 데 걸리는 시간

// 라운드별 설정 (그림 하나당 카드 2장)
// cols: 가로 장수 / cardWidth, cardHeight: 카드 크기 / gap: 카드 사이 간격
// preview: 시작 전에 앞면을 보여 주는 시간 / timeLimit: 제한 시간 (1000 = 1초)
const ROUNDS = [
  {
    // 1라운드: 8장, 4 × 2줄
    faces: ['frontcard1', 'frontcard2', 'frontcard3', 'frontcard4'],
    cols: 4,
    cardWidth: 270,
    cardHeight: 190,
    gap: 36,
    preview: 1000,
    timeLimit: 10000,
  },
  {
    // 2라운드: 12장, 4 × 3줄 (아래 게임기 그림과 겹치지 않게 카드를 조금 작게)
    faces: ['frontcard1', 'frontcard2', 'frontcard3', 'frontcard4', 'frontcard5', 'frontcard6'],
    cols: 4,
    cardWidth: 240,
    cardHeight: 168,
    gap: 28,
    preview: 2000,
    timeLimit: 15000,
  },
];

// 카드 그림 파일 (frontcard5는 검은 모서리를 투명하게 만든 사본 사용)
const CARD_FILES: Record<string, string> = {
  cardBack: 'cardgame_back.png',
  frontcard1: 'frontcard1.png',
  frontcard2: 'frontcard2.png',
  frontcard3: 'frontcard3.png',
  frontcard4: 'frontcard4.png',
  frontcard5: 'frontcard5_clear.png',
  frontcard6: 'frontcard6.png',
  perfect: 'perfect.png', // 2라운드까지 클리어하면 나오는 그림
};

type Card = Phaser.GameObjects.Image & { face: string; isOpen: boolean; isMatched: boolean; w: number; h: number };

// ───────── 화면 ─────────

// 카드 짝 맞추기 게임 화면
export class CardGameScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Image;
  private dialogue!: DialogueBox;
  private cards: Card[] = [];
  private firstPick: Card | null = null;
  private locked = true; // true면 카드를 눌러도 반응 없음 (미리 보기, 뒤집는 중 등)
  private timer: Phaser.Time.TimerEvent | null = null; // 라운드 제한 시간
  private timerLimit = 1;
  private timerFill!: Phaser.GameObjects.Graphics; // 시간 막대 안쪽 (줄어드는 부분)

  constructor() {
    super('CardGame');
  }

  preload() {
    this.load.image('cardgameBackground', 'assets/images/cardgame/cardgame_background.png');
    this.load.image('yoojung1', 'assets/images/common/yoojung1.png');
    for (const [key, file] of Object.entries(CARD_FILES)) {
      this.load.image(key, `assets/images/cardgame/${file}`);
    }
  }

  create() {
    const { width, height } = this.scale;
    this.cards = [];
    this.firstPick = null;
    this.locked = true;
    this.timer = null;

    // 배경: 화면을 빈틈없이 꽉 채움
    this.bg = this.add.image(width / 2, height / 2, 'cardgameBackground');
    this.bg.setScale(Math.max(width / this.bg.width, height / this.bg.height));

    // 시간 막대 (위쪽 가운데)
    this.drawTimerFrame();
    this.timerFill = this.add.graphics();
    this.drawTimerFill(1);

    // 뒤로 가기 버튼 (왼쪽 위, 누르면 메인 화면으로)
    addBackButton(this, 'Main');

    // 말풍선 (화면을 누르면 다음 대사)
    this.dialogue = createGuideDialogue(this);

    // 1라운드 설명 → 1라운드 시작
    this.showGuide(ROUND1_GUIDE, () => this.startRound(0));
  }

  // 매 화면마다: 남은 시간에 맞춰 시간 막대 줄이기
  update() {
    if (!this.timer) return;
    const remaining = this.timer.getRemaining();
    this.drawTimerFill(remaining / this.timerLimit, remaining < TIMER_WARNING);
  }

  // 시간 막대 틀: 모서리가 깎인 검은 픽셀 테두리 + 흰 안쪽
  private drawTimerFrame() {
    const g = this.add.graphics();
    const P = 4;
    const left = TIMER_X - TIMER_WIDTH / 2;
    const top = TIMER_Y - TIMER_HEIGHT / 2;
    g.fillStyle(0x1b1430).fillRect(left + P, top, TIMER_WIDTH - 2 * P, TIMER_HEIGHT).fillRect(left, top + P, TIMER_WIDTH, TIMER_HEIGHT - 2 * P);
    g.fillStyle(0xffffff).fillRect(left + P, top + P, TIMER_WIDTH - 2 * P, TIMER_HEIGHT - 2 * P);
  }

  // 시간 막대 안쪽: ratio(0~1)만큼 분홍으로 채움, warning이면 빨갛게 깜빡임
  private drawTimerFill(ratio: number, warning = false) {
    const P = 4;
    const innerW = TIMER_WIDTH - 4 * P;
    const left = TIMER_X - TIMER_WIDTH / 2 + 2 * P;
    const top = TIMER_Y - TIMER_HEIGHT / 2 + 2 * P;
    const blinkOn = Math.floor(this.time.now / 250) % 2 === 0;
    const color = warning ? (blinkOn ? 0xff3355 : 0xff8fa8) : 0xff5fae;
    this.timerFill.clear();
    this.timerFill.fillStyle(color).fillRect(left, top, Math.max(0, innerW * ratio), TIMER_HEIGHT - 4 * P);
    this.timerFill.fillStyle(0xffffff, 0.5).fillRect(left, top, Math.max(0, innerW * ratio), P); // 위쪽 반짝이는 줄
  }

  // 제한 시간 시작 / 멈춤
  private startTimer(roundIndex: number) {
    this.timerLimit = ROUNDS[roundIndex].timeLimit;
    this.timer = this.time.delayedCall(this.timerLimit, () => this.timeOver(roundIndex));
  }
  private stopTimer() {
    this.timer?.remove();
    this.timer = null;
  }

  // 시간 초과: 카드를 치우고 유정이 나와서 한 번 더 기회 → 같은 라운드 다시 시작
  private timeOver(roundIndex: number) {
    this.timer = null;
    if (this.cards.every((c) => c.isMatched)) return; // 마지막 짝을 막 맞춘 경우는 클리어로 처리
    this.locked = true;
    this.firstPick = null;
    this.drawTimerFill(0);
    this.time.removeAllEvents(); // 짝 틀림 후 다시 뒤집기 같은 남은 예약 취소
    this.tweens.killTweensOf(this.cards);
    this.tweens.add({
      targets: this.cards,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.cards.forEach((c) => c.destroy());
        this.cards = [];
        this.showGuide(RETRY_GUIDE, () => this.startRound(roundIndex));
      },
    });
  }

  // 캐릭터가 나와서 설명 → 대화가 끝나면 onDone 실행 (공통 기능 사용)
  private showGuide(lines: string[], onDone: () => void) {
    showGuide(this, this.bg, this.dialogue, lines, onDone);
  }

  // 라운드 시작: 카드를 섞어서 앞면으로 깔고 → 잠깐 보여 준 뒤 → 모두 뒤집어서 게임 시작
  private startRound(roundIndex: number) {
    const round = ROUNDS[roundIndex];
    const faces = Phaser.Utils.Array.Shuffle([...round.faces, ...round.faces]);
    const { cols, cardWidth: W, cardHeight: H, gap } = round;
    const rows = Math.ceil(faces.length / cols);
    const boardWidth = cols * W + (cols - 1) * gap;
    const boardHeight = rows * H + (rows - 1) * gap;
    const left = this.scale.width / 2 - boardWidth / 2 + W / 2;
    const top = BOARD_CENTER_Y - boardHeight / 2 + H / 2;
    this.firstPick = null;
    this.locked = true;
    this.drawTimerFill(1); // 시간 막대 가득 채우고 대기

    this.cards = faces.map((face, i) => {
      const x = left + (i % cols) * (W + gap);
      const y = top + Math.floor(i / cols) * (H + gap);
      const card = this.add.image(x, y, face).setDisplaySize(W, H) as Card;
      card.face = face;
      card.isOpen = true;
      card.isMatched = false;
      card.w = W;
      card.h = H;

      // 앞면이 보이는 상태로 하나씩 톡톡 등장
      card.setAlpha(0).setScale(card.scaleX * 0.6, card.scaleY * 0.6);
      this.tweens.add({ targets: card, alpha: 1, scaleX: card.scaleX / 0.6, scaleY: card.scaleY / 0.6, duration: 250, delay: i * 60, ease: 'Back.Out' });

      card.setInteractive({ useHandCursor: true });
      card.on('pointerdown', () => this.pickCard(card, roundIndex));
      return card;
    });

    // 잠깐 앞면을 보여 준 뒤 전부 뒷면으로 뒤집고 게임 시작
    const appearTime = faces.length * 60 + 250;
    this.time.delayedCall(appearTime + round.preview, () => {
      this.cards.forEach((card, i) => this.time.delayedCall(i * 40, () => this.flip(card, false)));
      this.time.delayedCall(this.cards.length * 40 + FLIP_TIME * 2, () => {
        this.locked = false;
        this.startTimer(roundIndex); // 카드가 다 뒤집히면 시간 시작
      });
    });
  }

  // 카드를 눌렀을 때
  private pickCard(card: Card, roundIndex: number) {
    if (this.locked || card.isOpen || card.isMatched) return;
    this.flip(card, true);

    // 첫 번째 카드면 기억해 두고 끝
    if (!this.firstPick) {
      this.firstPick = card;
      return;
    }

    // 두 번째 카드: 짝 확인
    const first = this.firstPick;
    this.firstPick = null;
    this.locked = true;

    if (first.face === card.face) {
      // 짝 맞음: 두 카드가 통 튀고 그대로 앞면 유지
      first.isMatched = card.isMatched = true;
      if (this.cards.every((c) => c.isMatched)) this.stopTimer(); // 마지막 짝이면 바로 시간 멈춤
      this.time.delayedCall(FLIP_TIME * 2, () => {
        for (const c of [first, card]) {
          this.tweens.add({ targets: c, scaleX: c.scaleX * 1.08, scaleY: c.scaleY * 1.08, duration: 120, yoyo: true });
        }
        this.locked = false;
        if (this.cards.every((c) => c.isMatched)) {
          playClearSound(); // 마지막 짝: 클리어 효과음
          this.time.delayedCall(600, () => this.finishRound(roundIndex));
        } else {
          playMatchSound(); // 짝 하나 맞춤: 짧은 효과음
        }
      });
    } else {
      // 짝 틀림: 잠깐 보여 준 뒤 둘 다 다시 뒷면으로
      this.time.delayedCall(MISMATCH_DELAY, () => {
        this.flip(first, false);
        this.flip(card, false);
        this.time.delayedCall(FLIP_TIME * 2, () => (this.locked = false));
      });
    }
  }

  // 카드 뒤집기 애니메이션: 가로로 납작해졌다가 그림을 바꾸고 다시 펴짐
  private flip(card: Card, toFront: boolean) {
    card.isOpen = toFront;
    this.tweens.add({
      targets: card,
      scaleX: 0,
      duration: FLIP_TIME,
      ease: 'Quad.In',
      onComplete: () => {
        card.setTexture(toFront ? card.face : 'cardBack');
        card.setDisplaySize(card.w, card.h);
        const targetScaleX = card.w / card.width;
        card.scaleX = 0;
        this.tweens.add({ targets: card, scaleX: targetScaleX, duration: FLIP_TIME, ease: 'Quad.Out' });
      },
    });
  }

  // 라운드 끝: 카드가 사라지고 다음 라운드 설명
  private finishRound(roundIndex: number) {
    this.tweens.add({
      targets: this.cards,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        this.cards.forEach((c) => c.destroy());
        this.cards = [];
        if (roundIndex === 0) {
          // 2라운드 설명 → 2라운드 시작
          this.showGuide(ROUND2_GUIDE, () => this.startRound(1));
        } else {
          // 2라운드까지 클리어: PERFECT!
          this.showPerfect();
        }
      },
    });
  }

  // 최종 클리어: perfect.png가 통 튀어나오고 둥실둥실 → 잠시 뒤 다음 게임(보드 점프)으로
  private showPerfect() {
    const PERFECT_WIDTH = 900; // 그림 가로 크기
    const NEXT_DELAY = 2500; // 다음 게임으로 넘어가기까지 기다리는 시간 (1000 = 1초)
    const img = this.add.image(this.scale.width / 2, BOARD_CENTER_Y, 'perfect').setDepth(50);
    const scale = PERFECT_WIDTH / img.width;
    img.setScale(0);
    this.tweens.add({ targets: img, scale, duration: 500, ease: 'Back.Out' });
    this.tweens.add({ targets: img, y: BOARD_CENTER_Y - 15, duration: 900, delay: 500, ease: 'Sine.InOut', yoyo: true, repeat: -1 });

    // 화면이 서서히 어두워지며 다음 게임으로
    this.time.delayedCall(NEXT_DELAY, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      // retry: false를 꼭 넘김 (안 넘기면 Phaser가 예전에 넘긴 '다시 하기' 값을 그대로 다시 씀)
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('RunGame', { retry: false }));
    });
  }
}

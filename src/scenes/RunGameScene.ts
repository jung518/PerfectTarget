import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox';
import { addBackButton } from '../ui/backButton';
import { createGuideDialogue, showGuide } from '../ui/guide';
import { playJumpSound } from '../clickSound';
import { PIXEL_FONT_STACK } from '../fonts';
import { t } from '../i18n';

// ───────── 설정 ─────────

// 대사는 src/i18n/locales/*.json의 runGame (한 줄 = 말풍선 한 번)
const INTRO_GUIDE = () => t('runGame.intro', { returnObjects: true });
const RETRY_GUIDE = () => t('runGame.retry', { returnObjects: true });
const CLEAR_GUIDE = () => t('runGame.clear', { returnObjects: true });

// 화면과 땅
const GROUND_Y = 705; // 땅 윗면 높이 (배경 그림의 땅 높이와 같게)
const PLAYER_SCREEN_X = 360; // 캐릭터가 화면에서 머무는 가로 위치
const PLAYER_HEIGHT = 190; // 캐릭터 세로 크기

// 움직임 (숫자가 클수록 빠르거나 높음)
const SPEED_START = 540; // 처음 달리는 속도 (1초에 몇 픽셀)
const SPEED_UP = 22; // 1초마다 빨라지는 정도 (시간이 지날수록 점점 빨라짐)
const SPEED_MAX = 1000; // 최고 속도
const GRAVITY = 2600; // 떨어지는 힘
const JUMP_POWER = 950; // 첫 번째 점프 힘
const DOUBLE_JUMP_POWER = 1050; // 더블 클릭 때 점프 힘 (공중돌기하며 더 높이)
const DOUBLE_TAP_TIME = 300; // 이 시간(밀리초) 안에 두 번 누르면 더블 클릭으로 봄

// 코스: [땅 길이, 그 뒤 구멍 폭] — 구멍이 넓을수록 점프 타이밍이 빠듯함
// 뒤로 갈수록 구멍은 넓어지고 땅은 짧아짐 (속도도 빨라지니 점점 어려워짐)
const COURSE: [number, number][] = [
  [1200, 240],
  [600, 270],
  [500, 300],
  [700, 270],
  [450, 380],
  [600, 480], // 넓은 구멍 (한 번 점프는 타이밍이 빠듯함)
  [400, 340],
  [500, 400],
  [350, 320],
  [600, 560], // 넓은 구멍
  [400, 420],
  [300, 380],
  [500, 480],
  [350, 430],
  [600, 620], // 넓은 구멍
  [300, 450],
  [400, 520],
  [300, 470],
  [500, 660], // 넓은 구멍
  [300, 500],
  [3000, 0], // 마지막 땅 (결승선 뒤로도 화면이 끝까지 땅으로 보이게 길게)
];
const FINISH_FROM_END = 2200; // 결승선 위치 (마지막 땅 끝에서 얼마나 앞)

// ───────── 화면 ─────────

type Segment = { start: number; end: number };

// 보드 타고 달리기 게임 화면
export class RunGameScene extends Phaser.Scene {
  private bg!: Phaser.GameObjects.Image;
  private dialogue!: DialogueBox;
  private player!: Phaser.GameObjects.Image;
  private segments: Segment[] = [];
  private hearts: Phaser.GameObjects.Image[] = [];
  private progressFill!: Phaser.GameObjects.Graphics;
  private finishX = 0;

  // 캐릭터 상태
  private px = 0; // 가로 위치 (발 가운데)
  private py = 0; // 세로 위치 (발 바닥)
  private vy = 0; // 세로 속도
  private speed = SPEED_START;
  private jumps = 0; // 공중에서 쓴 점프 횟수 (최대 2)
  private onGround = true;
  private jumpTime = 0; // 마지막으로 땅에서 점프한 시각 (더블 클릭 판단용)
  private falling = false; // 구멍에 빠지는 중
  private running = false; // 달리는 중인지 (설명 중에는 멈춤)

  constructor() {
    super('RunGame');
  }

  preload() {
    this.load.image('boardBackground', 'assets/images/arrowgame/board_backgound.png');
    this.load.image('boardYoojung', 'assets/images/arrowgame/board_yoojung.png');
    this.load.image('yoojung1', 'assets/images/common/yoojung1.png');
  }

  create(data: { retry?: boolean }) {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.cameras.main.scrollX = 0;
    this.segments = [];
    this.hearts = [];
    this.speed = SPEED_START;
    this.running = false;
    this.falling = false;

    // 배경 (화면에 고정)
    this.bg = this.add.image(width / 2, height / 2, 'boardBackground').setScrollFactor(0);
    this.bg.setScale(Math.max(width / this.bg.width, height / this.bg.height));

    // 코스 만들기 (땅, 구멍, 하트, 결승선)
    this.buildCourse(height);

    // 캐릭터 (보드 탄 유정)
    this.px = PLAYER_SCREEN_X;
    this.py = GROUND_Y;
    this.vy = 0;
    this.jumps = 0;
    this.onGround = true;
    // 기준점은 몸 가운데 (더블 점프 때 제자리에서 빙글 돌도록) → 발 위치(py)에서 몸 절반만큼 위에 그림
    this.player = this.add.image(this.px, this.py - PLAYER_HEIGHT / 2, 'boardYoojung').setDepth(5);
    this.player.setScale(PLAYER_HEIGHT / this.player.height);

    // 화면 위 고정 UI
    addBackButton(this, 'CardGame'); // 누르면 카드 짝 맞추기 게임으로
    this.drawProgressBar();
    // 화면 아무 곳이나 누르면 점프 (BACK 버튼을 누른 경우는 제외)
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length === 0) this.jump();
    });
    // PC에서는 스페이스바로도 점프 (꾹 누르고 있어도 한 번만)
    this.input.keyboard?.on('keydown-SPACE', (e: KeyboardEvent) => {
      if (!e.repeat) this.jump();
    });

    // 설명 → 달리기 시작 (다시 하기면 짧은 대사)
    // 설명하는 동안에는 보드 유정이 왼쪽에서 말하고, 달리는 캐릭터는 숨겨 둠
    this.player.setAlpha(0);
    this.dialogue = createGuideDialogue(this);
    showGuide(this, this.bg, this.dialogue, data?.retry ? RETRY_GUIDE() : INTRO_GUIDE(), () => this.startRunning(), 'boardYoojung');
  }

  // 달리는 캐릭터가 나타나고 출발
  private startRunning() {
    this.tweens.add({ targets: this.player, alpha: 1, duration: 300, onComplete: () => (this.running = true) });
  }

  // 코스: 구멍(어두운 바닥) 위에 땅 조각들을 깔고, 하트와 결승선 배치
  private buildCourse(height: number) {
    let x = 0;
    for (const [len, gap] of COURSE) {
      this.segments.push({ start: x, end: x + len });
      x += len + gap;
    }
    const courseEnd = this.segments[this.segments.length - 1].end;
    this.finishX = courseEnd - FINISH_FROM_END;

    const g = this.add.graphics().setDepth(10); // 캐릭터보다 앞 → 구멍에 빠지면 땅 뒤로 사라짐
    // 구멍: 어두운 보라 (배경 그림의 땅을 덮음)
    const pit = this.add.graphics().setDepth(1);
    pit.fillStyle(0x2a1846).fillRect(-400, GROUND_Y, courseEnd + 2400, height - GROUND_Y);

    // 땅 조각: 검은 윗선 + 보라 띠(밝은 네모 무늬) + 분홍 바닥
    for (const s of this.segments) {
      const w = s.end - s.start;
      g.fillStyle(0x1b1430).fillRect(s.start, GROUND_Y, w, 5);
      g.fillStyle(0x4648a6).fillRect(s.start, GROUND_Y + 5, w, 80);
      g.fillStyle(0x6366c0);
      for (let tx = s.start; tx < s.end - 14; tx += 16) {
        for (let row = 0; row < 3; row++) {
          if ((Math.floor(tx / 16) * 7 + row * 5) % 9 < 3) g.fillRect(tx, GROUND_Y + 14 + row * 22, 14, 14);
        }
      }
      g.fillStyle(0xfc4daf).fillRect(s.start, GROUND_Y + 85, w, height - GROUND_Y - 85);
      // 땅 양쪽 끝 검은 테두리
      g.fillStyle(0x1b1430).fillRect(s.start, GROUND_Y, 5, height - GROUND_Y);
      g.fillRect(s.end - 5, GROUND_Y, 5, height - GROUND_Y);
    }

    // 하트: 구멍 위(점프해야 먹음) + 땅 위 몇 개
    const heartKey = this.makeHeartTexture();
    this.segments.forEach((s, i) => {
      const next = this.segments[i + 1];
      if (next) {
        const gap = next.start - s.end;
        const h = gap >= 520 ? 280 : 170; // 넓은 구멍 위 하트는 더 높이 (더블 점프로 먹기)
        this.hearts.push(this.add.image(s.end + gap / 2, GROUND_Y - h, heartKey).setDepth(4));
      }
      const mid = (s.start + s.end) / 2;
      if (i % 2 === 1 && mid < this.finishX) this.hearts.push(this.add.image(mid, GROUND_Y - 70, heartKey).setDepth(4)); // 결승선 뒤에는 하트 없음
    });
    for (const h of this.hearts) {
      this.tweens.add({ targets: h, y: h.y - 10, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    // 결승선: 체크무늬 깃발
    const flag = this.add.graphics().setDepth(4);
    flag.fillStyle(0x1b1430).fillRect(this.finishX - 4, GROUND_Y - 260, 8, 260);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 6; c++) {
        flag.fillStyle((r + c) % 2 === 0 ? 0xffffff : 0x1b1430).fillRect(this.finishX + 4 + c * 18, GROUND_Y - 260 + r * 18, 18, 18);
      }
    }
    this.add
      .text(this.finishX, GROUND_Y - 290, 'GOAL', { fontFamily: PIXEL_FONT_STACK, fontSize: '44px', color: '#ffffff', stroke: '#1b1430', strokeThickness: 8 })
      .setOrigin(0.5)
      .setDepth(4);
  }

  // 점프 버튼 (오른쪽 아래, 분홍 픽셀 버튼)
  // 점프: 한 번 누르면 점프, 빠르게 두 번 누르면(더블 클릭) 공중돌기하며 더 높이
  // 점프한 뒤 시간이 지나서 공중에서 누른 건 무시 (실수로 공중돌기가 나가지 않게)
  private jump() {
    if (!this.running || this.falling) return;
    if (this.onGround) {
      this.vy = -JUMP_POWER;
      this.jumps = 1;
      this.onGround = false;
      this.jumpTime = this.time.now;
      playJumpSound();
    } else if (this.jumps === 1 && this.time.now - this.jumpTime <= DOUBLE_TAP_TIME) {
      this.vy = -DOUBLE_JUMP_POWER;
      this.jumps = 2;
      playJumpSound(true);
      // 더블 점프: 한 바퀴 빙글
      this.tweens.add({ targets: this.player, angle: 360, duration: 450, onComplete: () => this.player.setAngle(0) });
    }
  }

  // 진행 막대 (위쪽 가운데): 결승선까지 얼마나 왔는지
  private drawProgressBar() {
    const W = 420;
    const H = 30;
    const P = 4;
    const left = this.scale.width / 2 - W / 2;
    const top = 45;
    const g = this.add.graphics().setDepth(80).setScrollFactor(0);
    g.fillStyle(0x1b1430).fillRect(left + P, top, W - 2 * P, H).fillRect(left, top + P, W, H - 2 * P);
    g.fillStyle(0xffffff).fillRect(left + P, top + P, W - 2 * P, H - 2 * P);
    this.add
      .text(left + W + 16, top + H / 2, 'GOAL', { fontFamily: PIXEL_FONT_STACK, fontSize: '33px', color: '#ffffff', stroke: '#1b1430', strokeThickness: 6 })
      .setOrigin(0, 0.5)
      .setDepth(80)
      .setScrollFactor(0);
    this.progressFill = this.add.graphics().setDepth(81).setScrollFactor(0);
    this.updateProgress();
  }

  private updateProgress() {
    const W = 420;
    const P = 4;
    const left = this.scale.width / 2 - W / 2 + 2 * P;
    const ratio = Phaser.Math.Clamp((this.px - PLAYER_SCREEN_X) / (this.finishX - PLAYER_SCREEN_X), 0, 1);
    this.progressFill.clear();
    this.progressFill.fillStyle(0xff5fae).fillRect(left, 45 + 2 * P, (W - 4 * P) * ratio, 30 - 4 * P);
  }

  // 발 아래에 땅이 있는지 (조금 여유 있게 판정)
  private overGround(x: number) {
    const FOOT = 28;
    return this.segments.some((s) => x + FOOT >= s.start && x - FOOT <= s.end);
  }

  // 매 화면마다: 달리기, 중력, 착지, 하트, 결승선, 떨어짐 확인
  update(_time: number, delta: number) {
    if (!this.running) return;
    const dt = Math.min(delta, 50) / 1000;

    // 오른쪽으로 달리기 + 중력
    const prevY = this.py;
    this.speed = Math.min(SPEED_MAX, this.speed + SPEED_UP * dt); // 시간이 지날수록 빨라짐
    this.px += this.speed * dt;
    this.vy += GRAVITY * dt;
    this.py += this.vy * dt;

    // 착지: 위에서 땅으로 내려왔고 발 아래 땅이 있으면
    this.onGround = false;
    if (!this.falling && this.vy >= 0 && prevY <= GROUND_Y && this.py >= GROUND_Y && this.overGround(this.px)) {
      this.py = GROUND_Y;
      this.vy = 0;
      this.onGround = true;
      this.jumps = 0;
    }
    // 땅보다 아래로 내려갔는데 발 아래 땅이 없으면 구멍에 빠짐
    if (!this.onGround && this.py > GROUND_Y + 10 && !this.overGround(this.px)) this.falling = true;

    this.player.setPosition(this.px, this.py - PLAYER_HEIGHT / 2);
    if (!this.onGround && this.jumps < 2) this.player.setAngle(this.vy < 0 ? -8 : 6); // 공중에서 살짝 기울기
    else if (this.onGround) this.player.setAngle(0);
    this.cameras.main.scrollX = this.px - PLAYER_SCREEN_X;
    this.updateProgress();

    // 하트 먹기
    for (const h of this.hearts) {
      if (!h.active || h.getData('taken')) continue;
      const dx = h.x - this.px;
      const dy = h.y - (this.py - PLAYER_HEIGHT / 2);
      if (Math.abs(dx) < 70 && Math.abs(dy) < PLAYER_HEIGHT / 2 + 20) this.takeHeart(h);
    }

    // 결승선 통과 → 완주
    if (this.px >= this.finishX) this.finish();

    // 화면 아래로 떨어짐 → 실패, 처음부터 다시
    if (this.py > this.scale.height + 250) {
      this.running = false;
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ retry: true }));
    }
  }

  // 하트 먹기: 효과는 없고 "PERFECT!" 글자만 떠오름
  private takeHeart(h: Phaser.GameObjects.Image) {
    h.setData('taken', true);
    this.tweens.killTweensOf(h);
    this.tweens.add({ targets: h, scale: 1.8, alpha: 0, y: h.y - 40, duration: 300, onComplete: () => h.destroy() });
    const text = this.add
      .text(h.x, h.y - 30, 'PERFECT!', { fontFamily: PIXEL_FONT_STACK, fontSize: '33px', color: '#ffffff', stroke: '#ff3d9a', strokeThickness: 6 })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({ targets: text, y: text.y - 60, alpha: 0, duration: 700, onComplete: () => text.destroy() });
  }

  // 완주: 속도를 줄이며 멈추고 유정이 축하 → 옷 입히기로
  private finish() {
    this.running = false;
    this.player.setAngle(0);
    this.tweens.add({
      targets: this,
      px: this.px + 220,
      duration: 700,
      ease: 'Quad.Out',
      onUpdate: () => {
        this.player.setPosition(this.px, GROUND_Y - PLAYER_HEIGHT / 2);
        this.cameras.main.scrollX = this.px - PLAYER_SCREEN_X;
        this.updateProgress();
      },
      onComplete: () => {
        this.player.setAlpha(0); // 설명하는 보드 유정과 겹치지 않게
        // 완주 대사가 끝나면 마지막 순서(옷 입히기)로
        showGuide(this, this.bg, this.dialogue, CLEAR_GUIDE(), () => this.goDressUp(), 'boardYoojung');
      },
    });
  }

  private goDressUp() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('DressUp'));
  }

  // 픽셀 하트 그림 (한 번만 만들고 재사용)
  private makeHeartTexture() {
    const KEY = 'runHeart';
    if (this.textures.exists(KEY)) return KEY;
    const HEART = ['.KK...KK.', 'KPPK.KPPK', 'KPWPKPPPK', 'KPPPPPPPK', '.KPPPPPK.', '..KPPPK..', '...KPK...', '....K....'];
    const COLORS: Record<string, number> = { K: 0x1b1430, P: 0xff5fae, W: 0xffffff };
    const U = 7;
    const g = this.make.graphics({}, false);
    HEART.forEach((row, r) => [...row].forEach((ch, c) => COLORS[ch] && g.fillStyle(COLORS[ch]).fillRect(c * U, r * U, U, U)));
    g.generateTexture(KEY, HEART[0].length * U, HEART.length * U);
    g.destroy();
    return KEY;
  }
}

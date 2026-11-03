import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox';
import { addCharacter } from '../ui/character';
import { addBackButton } from '../ui/backButton';
import { playClickSound, playClearSound, playPickSound, playCountSound, playShutterSound } from '../clickSound';
import { PIXEL_FONT } from '../fonts';

// ───────── 설정 ─────────

// 대사 (한 줄 = 말풍선 한 번)
const INTRO_GUIDE = ['마지막 게임은 유댕이 꾸미기야!', '옷장에서 상의, 하의, 신발을 골라서\n귀엽고 멋진 유정이를 완성해 줘!'];
const ENDING_GUIDE = ['짜잔! 어때, 잘 어울려?', '오늘 코디 너무 마음에 들어!\n우리 기념사진 한 장 찍을까?'];

// 유정 (방 가운데쯤 서 있음)
const CHAR_X = 560; // 가운데 가로 위치
const CHAR_BOTTOM = 930; // 발 위치
const CHAR_HEIGHT = 560; // 세로 크기

// 옷장 (닫힘: 배경 오른쪽 라디오 자리 / 열림: 크게 보이게)
const CLOSET_X = 1380; // 닫힌 옷장 가운데 가로 위치
const CLOSET_BOTTOM = 905; // 닫힌 옷장 바닥 위치
const CLOSET_HEIGHT = 580; // 닫힌 옷장 세로 크기
const OPEN_X = 1200; // 열린 옷장 가운데 가로 위치
const OPEN_BOTTOM = 1000; // 열린 옷장 바닥 위치
const OPEN_HEIGHT = 900; // 열린 옷장 세로 크기

// 옷 목록: 아직 이미지 파일이 없는 옷은 옷장에 나오지 않음 (파일을 넣으면 자동으로 나옴)
// 옷 이미지는 옷만 그린 투명 PNG면 됨 (여백은 자동으로 잘라내고, SLOTS 자리에 맞춰 입힘)
// fit: 이 옷만 따로 위치·크기를 조정할 때 (SLOTS 값을 덮어씀)
type Fit = Partial<{ cx: number; y: number; width: number }>;
type Cloth = { key: string; file: string; fit?: Fit };
const CLOTHES: Record<'top' | 'bottom' | 'shoes', Cloth[]> = {
  top: [
    { key: 'top1', file: 'top1.png' },
    { key: 'top2', file: 'top2.png', fit: { width: 300, y: 668 } }, // 조끼: 길어서 좁게
    { key: 'top3', file: 'top3.png', fit: { width: 370, y: 664 } }, // 세일러복: 소매가 손을 덮지 않게
  ],
  bottom: [
    { key: 'bottom1', file: 'bottom1.png' },
    { key: 'bottom2', file: 'bottom2.png' },
    { key: 'bottom3', file: 'bottom3.png' },
  ],
  shoes: [
    { key: 'shoes2', file: 'shoes2.png', fit: { width: 300 } }, // 왼쪽: 검은 부츠
    { key: 'shoes1', file: 'shoes1.png', fit: { width: 290 } }, // 가운데: 갈색 구두
    { key: 'shoes3', file: 'shoes3.png', fit: { width: 290 } }, // 오른쪽: 흰 구두
  ],
};
type Category = keyof typeof CLOTHES;
const CATEGORIES: Category[] = ['top', 'bottom', 'shoes'];

// 옷이 입혀질 자리 (base.png 원본 좌표 기준, 1024x1536)
// cx: 가운데 가로 위치 / y: 기준 세로 위치 / width: 옷 가로 크기 (세로는 비율대로)
// anchor: 'top'이면 y가 옷의 윗선, 'bottom'이면 y가 옷의 아랫선 (신발은 발바닥에 맞춤)
const SLOTS: Record<Category, { cx: number; y: number; width: number; anchor: 'top' | 'bottom' }> = {
  top: { cx: 508, y: 662, width: 390, anchor: 'top' }, // 상의: 목 아래부터
  bottom: { cx: 510, y: 900, width: 360, anchor: 'top' }, // 하의: 허리부터
  shoes: { cx: 507, y: 1500, width: 330, anchor: 'bottom' }, // 신발: 발바닥에 맞춤
};
const DRAW_ORDER: Category[] = ['bottom', 'shoes', 'top']; // 겹치는 순서 (상의가 하의 허리를 덮음)

// 이미지 원본 속 실제 그림 범위 (옷장 두 장의 크기·여백이 달라서 바닥과 가운데를 맞추는 데 씀)
const CLOSED_BOX = { w: 1024, h: 1536, cx: 537, bottom: 1485, height: 1434 };
const OPEN_BOX = { w: 1272, h: 1237, cx: 631, bottom: 1182, height: 1170 };
const OPEN_INSIDE = { left: 380, right: 880, top: 240, bottom: 790 }; // 열린 옷장 안쪽 빈 칸

// 완성 조합 그림 이름: look_상의_하의_신발 (예: 상의2 + 하의1 + 신발3 → look_2_1_3)
const lookKey = (top: number, bottom: number, shoes: number) => `look_${top}_${bottom}_${shoes}`;

// 기념사진 (폴라로이드)
const PHOTO_FILE_NAME = 'perfect_target_photo.png'; // 저장할 때 파일 이름
const PHOTO_X = 500; // 사진 가운데 가로 위치
const PHOTO_Y = 480; // 사진 가운데 세로 위치
const PHOTO_ANGLE = -3; // 사진 기울기
const END_X = 1150; // THE END와 버튼들 가운데 가로 위치
const PHOTO_W = 520; // 사진 칸 가로
const PHOTO_H = 600; // 사진 칸 세로
const PHOTO_PAD = 26; // 흰 테두리 두께 (위·양옆)
const PHOTO_BOTTOM = 110; // 아래 흰 여백 높이 (폴라로이드처럼 아래가 더 두꺼움)
const SHOT_BUTTON_X = 1382; // 사진 찍기 버튼 가로 위치 (오른쪽 위, 왼쪽 위 BACK 버튼과 대칭)
const SHOT_BUTTON_Y = 88; // 사진 찍기 버튼 세로 위치

// ───────── 화면 ─────────

// 옷 입히기 화면 (전체 게임의 마지막)
export class DressUpScene extends Phaser.Scene {
  private dialogue!: DialogueBox;
  private character!: Phaser.GameObjects.Container;
  private closet!: Phaser.GameObjects.Image;
  private items: Phaser.GameObjects.Image[] = [];
  private picked: Partial<Record<Category, Cloth>> = {};
  private lookTexture = 'dressBase'; // 지금 입은 코디 그림 (사진에 들어감)
  private photoFile?: File; // 저장·공유할 사진 파일
  private closetReady = false; // true면 옷장을 눌러 열 수 있음

  constructor() {
    super('DressUp');
  }

  preload() {
    this.load.image('roomBackground', 'assets/images/dressup/room_background.png');
    this.load.image('closetClosed', 'assets/images/dressup/closet_closed.png');
    this.load.image('closetOpen', 'assets/images/dressup/closet_open.png');
    this.load.image('dressBase', 'assets/images/dressup/base.png');
    // 옷 이미지 (아직 없는 파일은 조용히 넘어감)
    this.load.on('loaderror', () => {});
    // 완성 조합 그림 27장 (look_상의번호_하의번호_신발번호.png, 아직 없는 파일은 조용히 넘어감)
    for (const t of [1, 2, 3]) for (const b of [1, 2, 3]) for (const sh of [1, 2, 3]) {
      const key = lookKey(t, b, sh);
      if (!this.textures.exists(key)) this.load.image(key, `assets/images/dressup/looks/${key}.png`);
    }
    for (const c of CATEGORIES.flatMap((cat) => CLOTHES[cat])) {
      if (!this.textures.exists(c.key)) this.load.image(c.key, `assets/images/dressup/${c.file}`);
    }
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.items = [];
    this.picked = {};
    this.lookTexture = 'dressBase';
    this.closetReady = false;

    // 방 배경
    const bg = this.add.image(width / 2, height / 2, 'roomBackground');
    bg.setScale(Math.max(width / bg.width, height / bg.height));

    // 닫힌 옷장 (라디오 자리)
    this.closet = this.add.image(0, 0, 'closetClosed');
    this.setClosed();

    // 유정 (흰 테두리 + 발밑 그림자). 옷장보다 앞에 보이게
    this.character = addCharacter(this, 'dressBase', CHAR_X, CHAR_BOTTOM, CHAR_HEIGHT).setDepth(20);

    addBackButton(this, 'RunGame');

    // 말풍선 (꼬리가 유정 머리를 가리킴)
    const BUBBLE_X = 760;
    this.dialogue = new DialogueBox(this, BUBBLE_X, 210, 1000, 260, '유정', CHAR_X - BUBBLE_X);
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length === 0) this.dialogue.next();
    });

    // 옷장 누르기
    this.closet.setInteractive({ useHandCursor: true, pixelPerfect: true });
    this.closet.on('pointerdown', () => this.openCloset());

    // 설명이 끝나면 옷장이 통통 튀며 "눌러 줘" 신호
    this.dialogue.start(INTRO_GUIDE, () => {
      this.closetReady = true;
      this.tweens.add({ targets: this.closet, y: this.closet.y - 12, duration: 350, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    });
  }

  // 옷장 그림을 닫힘/열림으로 바꾸면서, 실제 그림의 바닥과 가운데가 정해진 자리에 오게 맞춤
  private setClosed() {
    const s = CLOSET_HEIGHT / CLOSED_BOX.height;
    this.closet.setTexture('closetClosed').setScale(s).setOrigin(CLOSED_BOX.cx / CLOSED_BOX.w, CLOSED_BOX.bottom / CLOSED_BOX.h);
    this.closet.setPosition(CLOSET_X, CLOSET_BOTTOM);
  }
  private setOpen() {
    const s = OPEN_HEIGHT / OPEN_BOX.height;
    this.closet.setTexture('closetOpen').setScale(s).setOrigin(OPEN_BOX.cx / OPEN_BOX.w, OPEN_BOX.bottom / OPEN_BOX.h);
    this.closet.setPosition(OPEN_X, OPEN_BOTTOM);
  }

  // 옷장 열기: 문이 열리고 안에 옷이 줄지어 나타남
  private openCloset() {
    if (!this.closetReady) return;
    this.closetReady = false;
    this.tweens.killTweensOf(this.closet);
    this.closet.disableInteractive();
    playClickSound();
    this.setOpen();
    this.closet.setDepth(30); // 열리면 유정보다 앞으로
    this.tweens.add({ targets: this.closet, angle: { from: -2, to: 0 }, duration: 250, ease: 'Back.Out' });
    this.showClothes();

    // 아직 옷 이미지가 하나도 없으면: 빈 옷장을 한 번 더 누르면 닫히고 다음으로 진행
    if (this.items.length === 0) {
      this.closet.setInteractive({ useHandCursor: true, pixelPerfect: true });
      this.closet.once('pointerdown', () => this.closeAndDress());
    }
  }

  // 옷 이미지가 있는 종류만 (아직 이미지가 없는 종류는 고르지 않아도 됨)
  private availableCategories() {
    return CATEGORIES.filter((cat) => CLOTHES[cat].some((c) => this.textures.exists(c.key)));
  }

  // 옷장 안: 한 줄에 한 종류 (상의 / 하의 / 신발). 이미지가 있는 옷만 보여 줌
  private showClothes() {
    const s = OPEN_HEIGHT / OPEN_BOX.height;
    const left = OPEN_X + (OPEN_INSIDE.left - OPEN_BOX.cx) * s;
    const right = OPEN_X + (OPEN_INSIDE.right - OPEN_BOX.cx) * s;
    const top = OPEN_BOTTOM + (OPEN_INSIDE.top - OPEN_BOX.bottom) * s;
    const bottom = OPEN_BOTTOM + (OPEN_INSIDE.bottom - OPEN_BOX.bottom) * s;
    const rowH = (bottom - top) / CATEGORIES.length;
    const ICON = Math.min(rowH - 14, (right - left) / 3 - 14); // 아이콘 크기

    CATEGORIES.forEach((cat, r) => {
      const list = CLOTHES[cat].filter((c) => this.textures.exists(c.key));
      list.forEach((cloth, c) => {
        const x = left + ((c + 0.5) * (right - left)) / list.length;
        const y = top + (r + 0.5) * rowH;
        const icon = this.add.image(x, y, cloth.key, this.trimmedFrame(cloth.key)).setDepth(31);
        const fit = ICON / Math.max(icon.width, icon.height);
        icon.setScale(0).setData('fit', fit);
        this.tweens.add({ targets: icon, scale: fit, duration: 220, delay: 150 + (r * 3 + c) * 50, ease: 'Back.Out' });
        icon.setInteractive({ useHandCursor: true });
        icon.on('pointerdown', () => this.pick(cat, cloth, icon));
        icon.setData('cat', cat);
        this.items.push(icon);
      });
    });
  }

  // 옷 고르기: 같은 줄에서 고른 것만 밝게, 세 종류를 다 고르면 옷장이 닫히고 입혀짐
  private pick(cat: Category, cloth: Cloth, icon: Phaser.GameObjects.Image) {
    const needed = this.availableCategories();
    if (needed.every((c) => this.picked[c])) return; // 이미 다 골랐으면 무시
    playPickSound(); // 옷 고르기 전용 "뾰로롱" 소리
    this.picked[cat] = cloth;
    for (const it of this.items) {
      if (it.getData('cat') !== cat) continue;
      const on = it === icon;
      it.setAlpha(on ? 1 : 0.4);
      this.tweens.add({ targets: it, scale: it.getData('fit') * (on ? 1.15 : 1), duration: 120 });
    }
    if (needed.every((c) => this.picked[c])) this.time.delayedCall(600, () => this.closeAndDress());
  }

  // 옷장이 닫히고 → 유정에게 옷이 입혀지며 반짝 → 마지막 인사
  private closeAndDress() {
    this.items.forEach((it) => it.destroy());
    this.items = [];
    playClickSound();
    this.setClosed();
    this.closet.setDepth(0);
    this.tweens.add({ targets: this.closet, angle: { from: 2, to: 0 }, duration: 250, ease: 'Back.Out' });

    const base = this.character.list[this.character.list.length - 1] as Phaser.GameObjects.Image;

    // 방법 1: 고른 조합의 완성 그림이 있으면 유정 그림을 통째로 바꿈 (흰 테두리도 같은 그림으로)
    const num = (c?: Cloth) => Number(c?.key.match(/\d+$/)?.[0] ?? 0);
    const look = lookKey(num(this.picked.top), num(this.picked.bottom), num(this.picked.shoes));
    if (this.textures.exists(look)) {
      this.lookTexture = look;
      for (const part of this.character.list) {
        if (!(part instanceof Phaser.GameObjects.Image)) continue;
        part.setTexture(look);
        part.setScale(CHAR_HEIGHT / part.height); // 그림 크기가 base.png와 달라도 키는 같게
      }
    } else this.dressByLayers(base);
    this.celebrate();
  }

  // 방법 2 (조합 그림이 없을 때): 고른 옷을 유정 몸의 정해진 자리(SLOTS)에 맞춰 겹치기
  private dressByLayers(base: Phaser.GameObjects.Image) {
    const s = base.scaleX;
    const baseLeft = base.x - base.width * s * 0.5; // base.png 원본 (0,0)이 화면에 놓인 위치
    const baseTop = base.y - base.height * s;
    for (const cat of DRAW_ORDER) {
      const cloth = this.picked[cat];
      if (!cloth) continue; // 고른 옷이 없으면 (아직 이미지가 없는 종류) 건너뜀
      const slot = { ...SLOTS[cat], ...cloth.fit };
      const img = this.add.image(baseLeft + slot.cx * s, baseTop + slot.y * s, cloth.key, this.trimmedFrame(cloth.key));
      img.setOrigin(0.5, slot.anchor === 'top' ? 0 : 1).setScale((slot.width * s) / img.width);
      this.character.add(img);
    }
  }

  // 옷을 입은 뒤: 반짝 효과 → 마지막 인사
  private celebrate() {
    // 반짝 효과: 하얗게 번쩍 + 하트 뿅뿅
    playClearSound();
    this.tweens.add({ targets: this.character, scale: { from: 1.05, to: 1 }, duration: 300, ease: 'Back.Out' });
    this.cameras.main.flash(250, 255, 255, 255);
    this.popHearts(CHAR_X, CHAR_BOTTOM - CHAR_HEIGHT * 0.6);

    this.time.delayedCall(1200, () => this.dialogue.start(ENDING_GUIDE, () => this.showShotButton()));
  }

  // 사진 찍기 버튼: 누르면 버튼이 사라지고 사진 찍기 시작
  private showShotButton() {
    const btn = this.pixelButton(SHOT_BUTTON_X, SHOT_BUTTON_Y, '사진 찍기', () => {
      btn.disableInteractive();
      this.tweens.killTweensOf(btn);
      this.tweens.add({ targets: btn, alpha: 0, scale: 0.8, duration: 200, onComplete: () => btn.destroy() });
      this.takePhoto();
    });
    this.tweens.add({ targets: btn, alpha: 1, duration: 300 });
    // 통통 튀며 "눌러 줘" 신호
    this.tweens.add({ targets: btn, y: SHOT_BUTTON_Y - 10, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: 300 });
  }

  // 기념사진 찍기: 카메라 테두리 → 3, 2, 1 → 찰칵! → 폴라로이드 사진이 날아와 현상됨
  private takePhoto() {
    const { width, height } = this.scale;

    // 카메라 화면 테두리 (유정 주위 네 모서리) + REC
    const L = CHAR_X - 250, R = CHAR_X + 250, T = CHAR_BOTTOM - CHAR_HEIGHT - 50, B = CHAR_BOTTOM + 20;
    const C = 70; // 모서리 선 길이
    const frame = this.add.graphics().setDepth(150).setAlpha(0);
    frame.lineStyle(8, 0xffffff);
    frame.strokePoints([{ x: L, y: T + C }, { x: L, y: T }, { x: L + C, y: T }]);
    frame.strokePoints([{ x: R - C, y: T }, { x: R, y: T }, { x: R, y: T + C }]);
    frame.strokePoints([{ x: L, y: B - C }, { x: L, y: B }, { x: L + C, y: B }]);
    frame.strokePoints([{ x: R - C, y: B }, { x: R, y: B }, { x: R, y: B - C }]);
    const rec = this.add
      .text(L + 24, T + 18, '● REC', { fontFamily: `${PIXEL_FONT}, sans-serif`, fontSize: '33px', fontStyle: 'bold', color: '#ff4d4d' })
      .setDepth(150)
      .setAlpha(0);
    this.tweens.add({ targets: [frame, rec], alpha: 1, duration: 250 });
    this.tweens.add({ targets: rec, alpha: 0.3, duration: 400, yoyo: true, repeat: -1, delay: 250 });

    // 3, 2, 1 카운트다운 (유정 머리 위에 큰 숫자)
    ['3', '2', '1'].forEach((n, i) => {
      this.time.delayedCall(500 + i * 600, () => {
        playCountSound();
        const t = this.add
          .text(R - 110, T + 80, n, { fontFamily: `${PIXEL_FONT}, sans-serif`, fontSize: '110px', fontStyle: 'bold', color: '#ffffff', stroke: '#ff3d9a', strokeThickness: 12 })
          .setOrigin(0.5)
          .setDepth(151)
          .setScale(0.3);
        this.tweens.add({ targets: t, scale: 1, duration: 200, ease: 'Back.Out' });
        this.tweens.add({ targets: t, alpha: 0, delay: 400, duration: 150, onComplete: () => t.destroy() });
      });
    });

    // 찰칵! 하얀 플래시 → 화면이 어두워지고 사진이 날아옴
    this.time.delayedCall(2300, () => {
      playShutterSound();
      this.tweens.killTweensOf(rec);
      frame.destroy();
      rec.destroy();
      this.cameras.main.flash(700, 255, 255, 255);
      this.tweens.add({ targets: this.character, alpha: 0, duration: 400 }); // 유정은 사진 속으로
      const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x1b1430, 0).setDepth(200);
      this.tweens.add({ targets: dim, fillAlpha: 0.55, duration: 600 });
      this.time.delayedCall(500, () => this.showPhoto());
    });
  }

  // 폴라로이드 사진: 아래에서 날아와 놓이고, 까만 화면에서 서서히 현상됨 → THE END
  private showPhoto() {
    const canvas = this.drawPhoto();
    const KEY = 'endingPhoto';
    if (this.textures.exists(KEY)) this.textures.remove(KEY);
    this.textures.addCanvas(KEY, canvas);

    const photo = this.add.container(PHOTO_X, PHOTO_Y + 900).setDepth(210).setAngle(-12);
    const img = this.add.image(0, 0, KEY);
    const shadow = this.add.rectangle(10, 16, img.width, img.height, 0x000000, 0.35);
    // 현상 전 까만 사진 (사진 칸 위에 덮었다가 서서히 사라짐)
    const dark = this.add.rectangle(0, -img.height / 2 + PHOTO_PAD + PHOTO_H / 2, PHOTO_W, PHOTO_H, 0x2a2a2a);
    photo.add([shadow, img, dark]);

    this.tweens.add({ targets: photo, y: PHOTO_Y, angle: PHOTO_ANGLE, duration: 800, ease: 'Back.Out' });
    this.tweens.add({ targets: dark, alpha: 0, delay: 900, duration: 1600, ease: 'Sine.Out' });
    this.time.delayedCall(2600, () => {
      playClearSound();
      this.popHearts(PHOTO_X, PHOTO_Y - 150);
      this.showTheEnd(canvas);
    });
  }

  // 사진 그림 만들기 (방 배경 + 지금 코디한 유정 + 흰 테두리 + 글씨). 화면에 쓰고 저장할 때도 씀
  private drawPhoto() {
    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_W + PHOTO_PAD * 2;
    canvas.height = PHOTO_H + PHOTO_PAD + PHOTO_BOTTOM;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false; // 픽셀 그림이 흐려지지 않게

    // 흰 폴라로이드 종이
    ctx.fillStyle = '#fffdf6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 사진 칸: 방 배경 (유정이 서 있던 쪽)
    const bg = this.textures.get('roomBackground').getSourceImage() as HTMLImageElement;
    const s = PHOTO_H / bg.height;
    const sx = (bg.width - PHOTO_W / s) * 0.3;
    ctx.drawImage(bg, sx, 0, PHOTO_W / s, bg.height, PHOTO_PAD, PHOTO_PAD, PHOTO_W, PHOTO_H);

    // 코디한 유정
    const look = this.textures.get(this.lookTexture).getSourceImage() as HTMLImageElement;
    const h = PHOTO_H - 40;
    const w = (look.width / look.height) * h;
    ctx.drawImage(look, PHOTO_PAD + (PHOTO_W - w) / 2, PHOTO_PAD + PHOTO_H - h - 10, w, h);

    // 날짜 (옛날 필름 카메라처럼 주황색)
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    ctx.font = `22px ${PIXEL_FONT}`;
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff9b3d';
    ctx.shadowColor = '#ff6a00';
    ctx.shadowBlur = 4;
    ctx.fillText(`'${pad(d.getFullYear() % 100)} ${pad(d.getMonth() + 1)} ${pad(d.getDate())}`, PHOTO_PAD + PHOTO_W - 14, PHOTO_PAD + PHOTO_H - 14);
    ctx.shadowBlur = 0;
    return canvas;
  }

  // 사진 저장하기 (휴대폰은 공유 창, 컴퓨터는 파일로 저장)
  private savePhoto(canvas: HTMLCanvasElement) {
    const file = this.photoFile;
    // 휴대폰: 공유 창 열기 (아이폰은 "이미지 저장"으로 사진 앱에 바로 저장, 카톡·인스타로 보내기도 가능)
    const isPhone = navigator.maxTouchPoints > 0 && window.matchMedia('(pointer: coarse)').matches;
    if (isPhone && file && navigator.canShare?.({ files: [file] })) {
      navigator.share({ files: [file] }).catch((e: DOMException) => {
        if (e.name !== 'AbortError') this.downloadPhoto(canvas); // 공유가 안 되면 파일로 저장 (그냥 닫은 건 제외)
      });
      return;
    }
    // 컴퓨터: 파일로 저장
    this.downloadPhoto(canvas);
  }

  private downloadPhoto(canvas: HTMLCanvasElement) {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = PHOTO_FILE_NAME;
    a.click();
  }

  // THE END + 사진 저장하기 / 메인으로 버튼 (사진 오른쪽)
  private showTheEnd(photo: HTMLCanvasElement) {
    // 공유 창은 버튼을 누른 순간 바로 열어야 해서, 사진 파일을 미리 만들어 둠
    this.photoFile = undefined;
    photo.toBlob((blob) => {
      if (blob) this.photoFile = new File([blob], PHOTO_FILE_NAME, { type: 'image/png' });
    });
    const title = this.add
      .text(END_X, 330, 'THE END', {
        fontFamily: `${PIXEL_FONT}, sans-serif`,
        fontSize: '132px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#ff3d9a',
        strokeThickness: 14,
        shadow: { offsetX: 8, offsetY: 8, color: '#1b1430', fill: true, stroke: true },
      })
      .setOrigin(0.5)
      .setDepth(201)
      .setScale(0);
    this.tweens.add({ targets: title, scale: 1, duration: 600, ease: 'Back.Out' });

    const saveBtn = this.pixelButton(END_X, 520, '사진 저장하기', () => this.savePhoto(photo));
    const mainBtn = this.pixelButton(END_X, 650, '메인으로', () => this.scene.start('Main'));
    this.tweens.add({ targets: [saveBtn, mainBtn], alpha: 1, duration: 400, delay: 700 });
  }

  // 분홍 픽셀 버튼
  private pixelButton(x: number, y: number, text: string, onClick: () => void) {
    const W = 400;
    const H = 96;
    const P = 6;
    const btn = this.add.container(x, y).setDepth(201).setAlpha(0);
    const g = this.add.graphics();
    g.fillStyle(0x1b1430).fillRect(-W / 2 + P, -H / 2, W - 2 * P, H).fillRect(-W / 2, -H / 2 + P, W, H - 2 * P);
    g.fillStyle(0xff6fb5).fillRect(-W / 2 + 2 * P, -H / 2 + P, W - 4 * P, H - 2 * P).fillRect(-W / 2 + P, -H / 2 + 2 * P, W - 2 * P, H - 4 * P);
    g.fillStyle(0xffb3da).fillRect(-W / 2 + 2 * P, -H / 2 + P, W - 4 * P, P);
    g.fillStyle(0xd63c8a).fillRect(-W / 2 + 2 * P, H / 2 - 2 * P, W - 4 * P, P);
    const label = this.add
      .text(0, 0, text, { fontFamily: `${PIXEL_FONT}, sans-serif`, fontSize: '44px', fontStyle: 'bold', color: '#ffffff', stroke: '#8a1f55', strokeThickness: 8 })
      .setOrigin(0.5);
    btn.add([g, label]);
    btn.setSize(W, H).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.05, duration: 100 }));
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 100 }));
    btn.on('pointerup', () => onClick()); // 효과음 없음
    return btn;
  }

  // 하트 뿅뿅 (메인 화면과 같은 효과)
  private popHearts(x: number, y: number) {
    const key = this.heartTexture();
    for (let i = 0; i < 8; i++) {
      const h = this.add.image(x + Phaser.Math.Between(-120, 120), y + Phaser.Math.Between(-40, 40), key).setDepth(40).setScale(0);
      this.tweens.add({ targets: h, scale: Phaser.Math.FloatBetween(0.9, 1.5), duration: 150, delay: i * 60, ease: 'Back.Out' });
      this.tweens.add({ targets: h, y: h.y - 220, x: h.x + Phaser.Math.Between(-80, 80), delay: i * 60, duration: 1400, ease: 'Sine.Out', onComplete: () => h.destroy() });
      this.tweens.add({ targets: h, alpha: 0, delay: i * 60 + 700, duration: 700 });
    }
  }

  // 옷 이미지의 투명한 여백을 잘라낸 부분만 쓰도록 'trim' 영역을 만들어 둠
  // (옷 그림마다 여백이 달라도 같은 기준으로 크기·위치를 맞출 수 있음)
  private trimmedFrame(key: string) {
    const tex = this.textures.get(key);
    if (tex.has('trim')) return 'trim';
    const src = tex.getSourceImage() as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = src.width;
    canvas.height = src.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(src, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, src.width, src.height);
    let minX = width, minY = height, maxX = -1, maxY = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return '__BASE'; // 완전히 투명한 그림이면 그대로
    tex.add('trim', 0, minX, minY, maxX - minX + 1, maxY - minY + 1);
    return 'trim';
  }

  private heartTexture() {
    const KEY = 'dressHeart';
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

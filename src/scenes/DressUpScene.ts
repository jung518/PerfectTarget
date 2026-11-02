import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox';
import { addCharacter } from '../ui/character';
import { addBackButton } from '../ui/backButton';
import { playClickSound, playClearSound, playPickSound } from '../clickSound';
import { PIXEL_FONT } from '../fonts';

// ───────── 설정 ─────────

// 대사 (한 줄 = 말풍선 한 번)
const INTRO_GUIDE = ['마지막 게임은 유댕이 꾸미기야!', '옷장에서 상의, 하의, 신발을 골라서\n귀엽고 멋진 유정이를 완성해 줘!'];
const ENDING_GUIDE = ['짜잔! 어때, 잘 어울려?', '여기까지 함께해 줘서 고마워!\n 뿅!'];

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

// ───────── 화면 ─────────

// 옷 입히기 화면 (전체 게임의 마지막)
export class DressUpScene extends Phaser.Scene {
  private dialogue!: DialogueBox;
  private character!: Phaser.GameObjects.Container;
  private closet!: Phaser.GameObjects.Image;
  private items: Phaser.GameObjects.Image[] = [];
  private picked: Partial<Record<Category, Cloth>> = {};
  private closetReady = false; // true면 옷장을 눌러 열 수 있음

  constructor() {
    super('DressUp');
  }

  preload() {
    this.load.image('roomBackground', 'assets/images/dressup/room_background.png');
    this.load.image('closetClosed', 'assets/images/dressup/closet_closed.png');
    this.load.image('closetOpen', 'assets/images/dressup/closet_open.png');
    this.load.image('dressBase', 'assets/images/dressup/base.png');
    this.load.image('dressBare', 'assets/images/dressup/base_bare.png'); // 흰 기본 옷을 피부색으로 바꾼 사본 (옷 입힐 때 사용)
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
    base.setTexture('dressBare'); // 흰 기본 옷이 새 옷 가장자리로 삐져나오지 않게
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

    this.time.delayedCall(1200, () => this.dialogue.start(ENDING_GUIDE, () => this.showTheEnd()));
  }

  // THE END + 메인으로 돌아가기 버튼
  private showTheEnd() {
    const { width, height } = this.scale;
    const dim = this.add.rectangle(width / 2, height / 2, width, height, 0x1b1430, 0).setDepth(200);
    this.tweens.add({ targets: dim, fillAlpha: 0.55, duration: 600 });

    const title = this.add
      .text(width / 2, height / 2 - 60, 'THE END', {
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

    // 메인으로 버튼 (분홍 픽셀 버튼)
    const W = 360;
    const H = 96;
    const P = 6;
    const btn = this.add.container(width / 2, height / 2 + 130).setDepth(201).setAlpha(0);
    const g = this.add.graphics();
    g.fillStyle(0x1b1430).fillRect(-W / 2 + P, -H / 2, W - 2 * P, H).fillRect(-W / 2, -H / 2 + P, W, H - 2 * P);
    g.fillStyle(0xff6fb5).fillRect(-W / 2 + 2 * P, -H / 2 + P, W - 4 * P, H - 2 * P).fillRect(-W / 2 + P, -H / 2 + 2 * P, W - 2 * P, H - 4 * P);
    g.fillStyle(0xffb3da).fillRect(-W / 2 + 2 * P, -H / 2 + P, W - 4 * P, P);
    g.fillStyle(0xd63c8a).fillRect(-W / 2 + 2 * P, H / 2 - 2 * P, W - 4 * P, P);
    const label = this.add
      .text(0, 0, '메인으로', { fontFamily: `${PIXEL_FONT}, sans-serif`, fontSize: '44px', fontStyle: 'bold', color: '#ffffff', stroke: '#8a1f55', strokeThickness: 8 })
      .setOrigin(0.5);
    btn.add([g, label]);
    btn.setSize(W, H).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => this.tweens.add({ targets: btn, scale: 1.05, duration: 100 }));
    btn.on('pointerout', () => this.tweens.add({ targets: btn, scale: 1, duration: 100 }));
    btn.on('pointerup', () => {
      playClickSound();
      this.scene.start('Main');
    });
    this.tweens.add({ targets: btn, alpha: 1, duration: 400, delay: 700 });
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

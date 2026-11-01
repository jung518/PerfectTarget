import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox';

// 게임 화면 (GAME START를 누르면 이동하는 화면)
export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  preload() {
    // 이미지 불러오기에 실패하면 어떤 파일인지 개발자 도구(F12) 콘솔에 남김
    this.load.on('loaderror', (file: Phaser.Loader.File) => console.warn('[이미지 불러오기 실패]', file.key, file.src));

    this.load.image('background1', 'assets/images/backgrounds/background1.jpg');
    this.load.image('yoojung1', 'assets/images/characters/yoojung1.png');
  }

  create() {
    const { width, height } = this.scale;

    // 배경: 화면을 빈틈없이 꽉 채움 (비율이 달라 넘치는 부분은 잘림)
    const bg = this.add.image(width / 2, height / 2, 'background1');
    const fitBackground = () => bg.setScale(Math.max(width / bg.width, height / bg.height));
    fitBackground();

    // 배경 이미지가 없으면(불러오기 실패) 다시 불러와서 채워 넣기
    if (!this.textures.exists('background1')) {
      console.warn('[배경 없음] background1을 다시 불러옵니다');
      this.load.image('background1', 'assets/images/backgrounds/background1.jpg');
      this.load.once('complete', () => {
        bg.setTexture('background1');
        fitBackground();
      });
      this.load.start();
    }

    // 뒤로 가기 버튼 (분홍색 픽셀 버튼, 누르면 메인 화면으로)
    const W = 210; // 버튼 가로
    const H = 78; // 버튼 세로
    const P = 6; // 픽셀 한 칸 크기
    const btn = this.add.container(40 + W / 2, 40 + H / 2); // 왼쪽 위

    // 모서리가 깎인 픽셀 테두리 + 분홍 몸통 + 위 밝은 줄 + 아래 그림자 줄
    const g = this.add.graphics();
    g.fillStyle(0x1b1430).fillRect(-W / 2 + P, -H / 2, W - 2 * P, H).fillRect(-W / 2, -H / 2 + P, W, H - 2 * P);
    g.fillStyle(0xff6fb5).fillRect(-W / 2 + 2 * P, -H / 2 + P, W - 4 * P, H - 2 * P).fillRect(-W / 2 + P, -H / 2 + 2 * P, W - 2 * P, H - 4 * P);
    g.fillStyle(0xffb3da).fillRect(-W / 2 + 2 * P, -H / 2 + P, W - 4 * P, P);
    g.fillStyle(0xd63c8a).fillRect(-W / 2 + 2 * P, H / 2 - 2 * P, W - 4 * P, P);

    // 글자 (아래에 진한 분홍 그림자)
    const label = this.add.text(0, 0, '◀ BACK', {
      fontFamily: 'monospace',
      fontSize: '38px',
      fontStyle: 'bold',
      color: '#ffffff',
      shadow: { offsetX: 3, offsetY: 3, color: '#8a1f55', blur: 0, fill: true },
    });
    label.setOrigin(0.5);

    btn.add([g, label]);
    btn.setSize(W, H).setInteractive({ useHandCursor: true });

    // 버튼 효과: 마우스 올리면 커짐, 누르면 작아지며 살짝 내려감, 떼면 메인 화면으로
    const baseY = btn.y;
    const effect = (scale: number, offsetY: number) => {
      this.tweens.killTweensOf(btn);
      this.tweens.add({ targets: btn, scale, y: baseY + offsetY, duration: 80, ease: 'Quad.Out' });
    };
    btn.on('pointerover', () => effect(1.05, 0));
    btn.on('pointerout', () => effect(1, 0));
    btn.on('pointerdown', () => effect(0.95, 3));
    btn.on('pointerup', () => this.scene.start('Main'));

    // 온보딩: 캐릭터 + 말풍선 대화
    const CHAR_X = 811; // 캐릭터 가운데 가로 위치
    const CHAR_BOTTOM = 950; // 캐릭터 발 위치
    const CHAR_HEIGHT = 480; // 캐릭터 세로 길이
    const charScale = CHAR_HEIGHT / this.textures.get('yoojung1').getSourceImage().height;

    // 발밑 그림자 (반투명 타원)
    const SHADOW_WIDTH = 300; // 그림자 가로
    const SHADOW_HEIGHT = 40; // 그림자 세로
    this.add.ellipse(CHAR_X - 20, CHAR_BOTTOM - 10, SHADOW_WIDTH, SHADOW_HEIGHT, 0x8a1f55, 0.35);

    // 흰색 테두리: 캐릭터를 하얗게 칠한 복사본을 사방으로 살짝씩 밀어서 뒤에 깔기
    const OUTLINE = 5; // 테두리 두께
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16;
      this.add
        .image(CHAR_X + Math.cos(a) * OUTLINE, CHAR_BOTTOM + Math.sin(a) * OUTLINE, 'yoojung1')
        .setOrigin(0.5, 1)
        .setScale(charScale)
        .setTintFill(0xffffff);
    }

    this.add.image(CHAR_X, CHAR_BOTTOM, 'yoojung1').setOrigin(0.5, 1).setScale(charScale);

    // 말풍선 (캐릭터 머리 위)
    const dialogue = new DialogueBox(this, CHAR_X, 290, 1000, 260, '유정');

    // 튜토리얼 대사 (한 줄 = 말풍선 한 번)
    const TUTORIAL_LINES = [
      '안녕! 나는 유정이야.\n퍼펙트 타겟에 온 걸 환영해!',
      '대화는 화면 아무 곳이나 누르면 다음으로 넘어가.',
      '앞으로 게임 방법을 하나씩 알려 줄게. 잘 따라와 줘!',
      '그럼, 시작해 볼까?',
    ];
    dialogue.start(TUTORIAL_LINES);

    // 화면을 누르면 다음 대사 (BACK 버튼을 누른 경우는 제외)
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length === 0) dialogue.next();
    });
  }
}

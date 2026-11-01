import Phaser from 'phaser';

// 게임 화면 (GAME START를 누르면 이동하는 화면)
export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  preload() {
    this.load.image('background1', 'assets/images/backgrounds/background1.jpg');
  }

  create() {
    const { width, height } = this.scale;

    // 배경: 화면을 빈틈없이 꽉 채움 (비율이 달라 넘치는 부분은 잘림)
    const bg = this.add.image(width / 2, height / 2, 'background1');
    bg.setScale(Math.max(width / bg.width, height / bg.height));

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
  }
}

import Phaser from 'phaser';

// 뒤로 가기 버튼 (분홍색 픽셀 버튼, 왼쪽 위)
// target: 누르면 이동할 화면 이름 (예: 'Main')

const W = 210; // 버튼 가로
const H = 78; // 버튼 세로
const P = 6; // 픽셀 한 칸 크기

export function addBackButton(scene: Phaser.Scene, target: string) {
  const btn = scene.add.container(40 + W / 2, 40 + H / 2).setDepth(80).setScrollFactor(0); // 왼쪽 위, 화면이 움직여도 제자리

  // 모서리가 깎인 픽셀 테두리 + 분홍 몸통 + 위 밝은 줄 + 아래 그림자 줄
  const g = scene.add.graphics();
  g.fillStyle(0x1b1430).fillRect(-W / 2 + P, -H / 2, W - 2 * P, H).fillRect(-W / 2, -H / 2 + P, W, H - 2 * P);
  g.fillStyle(0xff6fb5).fillRect(-W / 2 + 2 * P, -H / 2 + P, W - 4 * P, H - 2 * P).fillRect(-W / 2 + P, -H / 2 + 2 * P, W - 2 * P, H - 4 * P);
  g.fillStyle(0xffb3da).fillRect(-W / 2 + 2 * P, -H / 2 + P, W - 4 * P, P);
  g.fillStyle(0xd63c8a).fillRect(-W / 2 + 2 * P, H / 2 - 2 * P, W - 4 * P, P);

  // 글자 (아래에 진한 분홍 그림자)
  const label = scene.add.text(0, 0, '◀ BACK', {
    fontFamily: 'monospace',
    fontSize: '38px',
    fontStyle: 'bold',
    color: '#ffffff',
    shadow: { offsetX: 3, offsetY: 3, color: '#8a1f55', blur: 0, fill: true },
  });
  label.setOrigin(0.5);

  btn.add([g, label]);
  btn.setSize(W, H).setInteractive({ useHandCursor: true });

  // 버튼 효과: 마우스 올리면 커짐, 누르면 작아지며 살짝 내려감, 떼면 target 화면으로
  const baseY = btn.y;
  const effect = (scale: number, offsetY: number) => {
    scene.tweens.killTweensOf(btn);
    scene.tweens.add({ targets: btn, scale, y: baseY + offsetY, duration: 80, ease: 'Quad.Out' });
  };
  btn.on('pointerover', () => effect(1.05, 0));
  btn.on('pointerout', () => effect(1, 0));
  btn.on('pointerdown', () => effect(0.95, 3));
  btn.on('pointerup', () => scene.scene.start(target));

  return btn;
}

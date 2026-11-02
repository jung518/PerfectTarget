import Phaser from 'phaser';

// 대화 화면용 캐릭터: 발밑 그림자 + 흰색 테두리 + 캐릭터 이미지
// x: 캐릭터 가운데 가로 위치 / bottom: 발 위치 / height: 캐릭터 세로 길이

const OUTLINE = 5; // 흰 테두리 두께
const SHADOW_WIDTH = 300; // 발밑 그림자 가로
const SHADOW_HEIGHT = 40; // 발밑 그림자 세로

// 그림자, 테두리, 캐릭터를 한 묶음(container)으로 돌려줌 → 한꺼번에 움직이거나 사라지게 할 수 있음
export function addCharacter(scene: Phaser.Scene, key: string, x: number, bottom: number, height: number) {
  const scale = height / scene.textures.get(key).getSourceImage().height;
  const parts: Phaser.GameObjects.GameObject[] = [];

  // 발밑 그림자 (반투명 타원)
  parts.push(scene.add.ellipse(x - 20, bottom - 10, SHADOW_WIDTH, SHADOW_HEIGHT, 0x8a1f55, 0.35));

  // 흰색 테두리: 캐릭터를 하얗게 칠한 복사본을 사방으로 살짝씩 밀어서 뒤에 깔기
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16;
    parts.push(
      scene.add
        .image(x + Math.cos(a) * OUTLINE, bottom + Math.sin(a) * OUTLINE, key)
        .setOrigin(0.5, 1)
        .setScale(scale)
        .setTintFill(0xffffff),
    );
  }

  parts.push(scene.add.image(x, bottom, key).setOrigin(0.5, 1).setScale(scale));
  return scene.add.container(0, 0, parts).setDepth(90).setScrollFactor(0); // 화면이 움직여도 제자리
}

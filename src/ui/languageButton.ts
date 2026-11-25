import Phaser from 'phaser';
import i18n, { LANGUAGES, currentLanguage, type Language } from '../i18n';
import { PIXEL_FONT_STACK } from '../fonts';

// 언어 고르기 탭 (픽셀 버튼, 오른쪽 위)
// [ KO | EN | JA ] 처럼 언어마다 칸이 나뉘어 있고, 지금 언어 칸은 분홍으로 채워짐
// 다른 언어 칸을 누르면 그 언어로 바뀌고 화면을 다시 그림 (효과음 없음)

const SEG_W = 96; // 칸 하나 가로
const H = 78; // 세로 (BACK 버튼과 같게)
const P = 6; // 픽셀 한 칸 크기
const MARGIN_RIGHT = 40; // 화면 오른쪽 끝에서 떨어진 거리
const MARGIN_TOP = 24; // 화면 위쪽 끝에서 떨어진 거리 (작을수록 위로)
const COLOR = {
  outline: 0x1b1430, // 검은 테두리·칸 사이 선
  selected: 0xff6fb5, // 고른 칸
  selectedLight: 0xffb3da, // 고른 칸 위쪽 밝은 줄
  selectedShadow: 0xd63c8a, // 고른 칸 아래쪽 그림자 줄
  idle: 0xfff5fa, // 안 고른 칸
  hover: 0xffd6ea, // 안 고른 칸에 마우스를 올렸을 때
  idleShadow: 0xf0c6dc, // 안 고른 칸 아래쪽 그림자 줄
};

export function addLanguageButton(scene: Phaser.Scene) {
  const W = P + LANGUAGES.length * (SEG_W + P); // 전체 가로 = 테두리 + 칸들 + 칸 사이 선
  const { width } = scene.scale;
  const root = scene.add.container(width - MARGIN_RIGHT - W / 2, MARGIN_TOP + H / 2).setDepth(80).setScrollFactor(0);

  // 바깥 테두리 (모서리를 픽셀처럼 깎음)
  const frame = scene.add.graphics();
  frame.fillStyle(COLOR.outline).fillRect(-W / 2 + P, -H / 2, W - 2 * P, H).fillRect(-W / 2, -H / 2 + P, W, H - 2 * P);
  root.add(frame);

  const current = currentLanguage();
  LANGUAGES.forEach((lng, i) => {
    const isSelected = lng === current;
    const x = -W / 2 + P + i * (SEG_W + P); // 칸 왼쪽 끝
    const y = -H / 2 + P; // 칸 위쪽 끝
    const h = H - 2 * P;
    // 맨 왼쪽·오른쪽 칸은 바깥 모서리를 한 칸 더 깎음
    const cutL = i === 0 ? P : 0;
    const cutR = i === LANGUAGES.length - 1 ? P : 0;

    // 칸 바탕
    const bg = scene.add.graphics();
    const draw = (fill: number) => {
      bg.clear();
      bg.fillStyle(fill).fillRect(x + cutL, y, SEG_W - cutL - cutR, h).fillRect(x, y + P, SEG_W, h - 2 * P);
      if (isSelected) bg.fillStyle(COLOR.selectedLight).fillRect(x + cutL, y, SEG_W - cutL - cutR, P);
      bg.fillStyle(isSelected ? COLOR.selectedShadow : COLOR.idleShadow).fillRect(x + cutL, y + h - P, SEG_W - cutL - cutR, P);
    };
    draw(isSelected ? COLOR.selected : COLOR.idle);

    // 칸 글자 (고른 칸은 흰 글자 + 진한 분홍 테두리, 나머지는 연한 분홍 글자)
    const label = scene.add
      .text(x + SEG_W / 2, 0, lng.toUpperCase(), {
        fontFamily: PIXEL_FONT_STACK,
        fontSize: '33px',
        fontStyle: 'bold',
        color: isSelected ? '#ffffff' : '#c56a9c',
        stroke: '#8a1f55',
        strokeThickness: isSelected ? 6 : 0,
      })
      .setOrigin(0.5);
    root.add([bg, label]);

    // 지금 언어 칸은 눌러도 반응 없음
    if (isSelected) return;

    // 안 고른 칸: 마우스 올리면 진해지고, 누르면 글자가 살짝 내려가고, 떼면 그 언어로
    const hit = scene.add.zone(x + SEG_W / 2, 0, SEG_W, H).setInteractive({ useHandCursor: true });
    root.add(hit);
    const baseY = label.y;
    hit.on('pointerover', () => draw(COLOR.hover));
    hit.on('pointerout', () => {
      draw(COLOR.idle);
      label.setY(baseY);
    });
    hit.on('pointerdown', () => label.setY(baseY + 3));
    hit.on('pointerup', () => changeLanguage(scene, lng));
  });

  return root;
}

async function changeLanguage(scene: Phaser.Scene, lng: Language) {
  await i18n.changeLanguage(lng); // 고른 언어는 localStorage에 저장돼서 다음 방문 때도 유지
  scene.scene.restart(); // Phaser 글자는 만들 때 한 번 그려지므로, 화면을 새로 그려서 바뀐 언어 반영
}

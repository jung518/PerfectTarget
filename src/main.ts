import Phaser from 'phaser';
import './i18n'; // 다국어 설정 (씬보다 먼저 불러와야 함)
import { MainScene } from './scenes/MainScene';
import { GameScene } from './scenes/GameScene';
import { CardGameScene } from './scenes/CardGameScene';
import { RunGameScene } from './scenes/RunGameScene';
import { DressUpScene } from './scenes/DressUpScene';
import { loadFonts } from './fonts';
import { inject } from '@vercel/analytics';

// 방문자 수 세기 (Vercel 대시보드의 Analytics 탭에서 확인, 배포된 사이트에서만 집계됨)
inject();

// 게임 기본 설정 (씬은 직접 만들어서 scene 배열에 추가)
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1622, // 메인 배경(start_no_text.png) 크기와 같게
  height: 970,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene, GameScene, CardGameScene, RunGameScene, DressUpScene],
};

// 픽셀 글꼴을 먼저 불러온 뒤 게임 시작 (글꼴을 못 불러와도 게임은 시작)
loadFonts()
  .catch((e) => console.warn('[글꼴 불러오기 실패]', e))
  .finally(() => new Phaser.Game(config));

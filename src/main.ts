import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { GameScene } from './scenes/GameScene';

// 게임 기본 설정 (씬은 직접 만들어서 scene 배열에 추가)
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 1622, // start.png 크기와 같게
  height: 970,
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene, GameScene],
};

new Phaser.Game(config);

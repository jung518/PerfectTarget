import Phaser from 'phaser';
import { DialogueBox } from '../ui/DialogueBox';
import { addCharacter } from '../ui/character';
import { addBackButton } from '../ui/backButton';

// 게임 화면 (GAME START를 누르면 이동하는 화면)
export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  preload() {
    // 이미지 불러오기에 실패하면 어떤 파일인지 개발자 도구(F12) 콘솔에 남김
    this.load.on('loaderror', (file: Phaser.Loader.File) => console.warn('[이미지 불러오기 실패]', file.key, file.src));

    this.load.image('background1', 'assets/images/onboarding/background1.jpg');
    this.load.image('yoojung1', 'assets/images/common/yoojung1.png');
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
      this.load.image('background1', 'assets/images/onboarding/background1.jpg');
      this.load.once('complete', () => {
        bg.setTexture('background1');
        fitBackground();
      });
      this.load.start();
    }

    // 뒤로 가기 버튼 (왼쪽 위, 누르면 메인 화면으로)
    addBackButton(this, 'Main');

    // 온보딩: 캐릭터 + 말풍선 대화
    const CHAR_X = 811; // 캐릭터 가운데 가로 위치
    const CHAR_BOTTOM = 950; // 캐릭터 발 위치
    const CHAR_HEIGHT = 480; // 캐릭터 세로 길이
    addCharacter(this, 'yoojung1', CHAR_X, CHAR_BOTTOM, CHAR_HEIGHT); // 흰 테두리 + 발밑 그림자 포함

    // 말풍선 (캐릭터 머리 위)
    const dialogue = new DialogueBox(this, CHAR_X, 290, 1000, 260, '유정');

    // 튜토리얼 대사 (한 줄 = 말풍선 한 번)
    const TUTORIAL_LINES = [
      '안녕! 나는 유정이야.',
      '대화는 화면 아무 곳이나 누르면 다음으로 넘어가.',
      '앞으로 게임 방법을 하나씩 알려 줄게.\n잘 따라와 줘!',
      '그럼, 시작해 볼까?',
    ];
    // 대화가 끝나면 잠깐 뒤 카드 게임 화면으로 자동 이동
    dialogue.start(TUTORIAL_LINES, () => this.time.delayedCall(400, () => this.scene.start('CardGame')));

    // 화면을 누르면 다음 대사 (BACK 버튼을 누른 경우는 제외)
    this.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (over.length === 0) dialogue.next();
    });
  }
}

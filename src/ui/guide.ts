import Phaser from 'phaser';
import { DialogueBox } from './DialogueBox';
import { addCharacter } from './character';

// 게임 화면에서 캐릭터가 나와 설명하는 공통 기능
// 캐릭터는 화면 왼쪽, 말풍선은 오른쪽 위 (꼬리가 캐릭터 머리를 가리킴)

const CHAR_X = 260; // 캐릭터 가운데 가로 위치
const CHAR_BOTTOM = 950; // 캐릭터 발 위치
const CHAR_HEIGHT = 480; // 캐릭터 세로 길이
const BUBBLE_X = 640; // 말풍선 가운데 가로 위치
const BLUR_STRENGTH = 1.5; // 설명하는 동안 배경 흐린 정도

// 말풍선 만들기 + 화면을 누르면 다음 대사로 (버튼·카드처럼 누를 수 있는 걸 누른 경우는 제외)
export function createGuideDialogue(scene: Phaser.Scene) {
  const dialogue = new DialogueBox(scene, BUBBLE_X, 290, 1000, 260, '유정', CHAR_X - BUBBLE_X + 40);
  scene.input.on('pointerdown', (_pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
    if (over.length === 0) dialogue.next();
  });
  return dialogue;
}

// 캐릭터가 나와서 설명 (배경 흐리게) → 대화가 끝나면 캐릭터가 사라지고 onDone 실행
export function showGuide(
  scene: Phaser.Scene,
  bg: Phaser.GameObjects.Image,
  dialogue: DialogueBox,
  lines: string[],
  onDone: () => void = () => {},
  characterKey = 'yoojung1', // 설명하는 캐릭터 그림
) {
  const blur = bg.preFX?.addBlur(1, 2, 2, BLUR_STRENGTH);
  const character = addCharacter(scene, characterKey, CHAR_X, CHAR_BOTTOM, CHAR_HEIGHT).setAlpha(0);
  scene.tweens.add({ targets: character, alpha: 1, duration: 300 });

  dialogue.start(lines, () => {
    // 캐릭터가 서서히 사라짐
    scene.tweens.add({ targets: character, alpha: 0, duration: 400, onComplete: () => character.destroy() });
    // 배경이 서서히 선명해짐
    if (blur) {
      scene.tweens.add({ targets: blur, strength: 0, duration: 500, onComplete: () => bg.preFX?.remove(blur) });
    }
    scene.time.delayedCall(500, onDone);
  });
}

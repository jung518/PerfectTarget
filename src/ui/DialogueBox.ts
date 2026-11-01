import Phaser from 'phaser';
import { playTypeSound } from '../clickSound';
import { PIXEL_FONT } from '../fonts';

// NPC 대화 말풍선: 대사를 한 글자씩 타이핑하듯 보여 주고, 누르면 다음 대사로 넘어감

const COLOR = {
  outline: 0x1b1430, // 검은 테두리
  border: 0xff6fb5, // 분홍 테두리
  fill: 0xfff5fa, // 말풍선 안쪽
  text: '#4a2340', // 대사 글자
};
const P = 6; // 픽셀 한 칸 크기
const PADDING = 48; // 말풍선 안쪽 여백
const TYPE_SPEED = 45; // 한 글자가 나오는 간격 (1000 = 1초, 작을수록 빠름)

export class DialogueBox {
  private container: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private arrow: Phaser.GameObjects.Graphics;
  private typing?: Phaser.Time.TimerEvent;
  private lines: string[] = [];
  private index = 0;
  private fullText = '';
  private isTyping = false;
  private onEnd?: () => void;

  // x, y: 말풍선 가운데 위치 / name: 이름표에 들어갈 이름
  constructor(private scene: Phaser.Scene, x: number, y: number, width: number, height: number, name: string) {
    const left = -width / 2;
    const top = -height / 2;

    // 말풍선 몸통: 검은 테두리 → 분홍 테두리 → 안쪽 (모서리는 픽셀처럼 깎음)
    const g = scene.add.graphics();
    const box = (inset: number, color: number) => {
      const i = inset * P;
      g.fillStyle(color);
      g.fillRect(left + i + P, top + i, width - 2 * i - 2 * P, height - 2 * i);
      g.fillRect(left + i, top + i + P, width - 2 * i, height - 2 * i - 2 * P);
    };
    box(0, COLOR.outline);
    box(1, COLOR.border);
    box(2, COLOR.fill);

    // 말풍선 꼬리 (아래 가운데, 캐릭터 머리 쪽을 가리킴)
    const tailTop = top + height - 3 * P;
    for (let r = 0; r < 9; r++) {
      const half = 9 - r;
      const y = tailTop + r * P;
      g.fillStyle(COLOR.outline).fillRect(-half * P, y, half * 2 * P, P);
      if (half > 1) g.fillStyle(COLOR.border).fillRect(-(half - 1) * P, y, (half - 1) * 2 * P, P);
      if (half > 2) g.fillStyle(COLOR.fill).fillRect(-(half - 2) * P, y, (half - 2) * 2 * P, P);
    }

    // 이름표 (왼쪽 위)
    const tagW = 170;
    const tagH = 56;
    const tagX = left + 40;
    const tagY = top - tagH / 2;
    g.fillStyle(COLOR.outline).fillRect(tagX + P, tagY, tagW - 2 * P, tagH).fillRect(tagX, tagY + P, tagW, tagH - 2 * P);
    g.fillStyle(COLOR.border).fillRect(tagX + P, tagY + P, tagW - 2 * P, tagH - 2 * P);
    const nameText = scene.add
      .text(tagX + tagW / 2, tagY + tagH / 2, name, {
        fontFamily: `${PIXEL_FONT}, sans-serif`,
        fontSize: '33px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#8a1f55', // 진한 분홍 테두리 (작게 보여도 또렷하게)
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // 대사 글자
    this.text = scene.add.text(left + PADDING, top + PADDING, '', {
      fontFamily: `${PIXEL_FONT}, sans-serif`, // 레트로 픽셀 글꼴
      fontSize: '44px', // 11의 배수일 때 가장 또렷함
      color: COLOR.text,
      lineSpacing: 12,
      wordWrap: { width: width - PADDING * 2, useAdvancedWrap: true },
    });

    // 다음 대사 표시 ▼ (오른쪽 아래에서 깜빡임)
    this.arrow = scene.add.graphics();
    this.arrow.fillStyle(COLOR.border);
    [5, 3, 1].forEach((w, r) => this.arrow.fillRect(-(w * P) / 2, r * P, w * P, P));
    this.arrow.setPosition(width / 2 - 60, height / 2 - 50).setVisible(false);
    scene.tweens.add({ targets: this.arrow, alpha: 0.2, duration: 400, yoyo: true, repeat: -1 });

    this.container = scene.add.container(x, y, [g, nameText, this.text, this.arrow]);
    this.container.setVisible(false);
  }

  // 대사 목록을 처음부터 보여 주기 (다 끝나면 onEnd 실행)
  start(lines: string[], onEnd?: () => void) {
    this.lines = lines;
    this.index = 0;
    this.onEnd = onEnd;
    this.container.setVisible(true).setAlpha(1);
    this.showLine();
  }

  // 화면을 눌렀을 때: 타이핑 중이면 문장을 한 번에 다 보여 주고, 다 나왔으면 다음 대사로
  next() {
    if (!this.container.visible) return;
    if (this.isTyping) {
      this.finishTyping();
      return;
    }
    this.index++;
    if (this.index < this.lines.length) {
      this.showLine();
    } else {
      // 대화 끝: 말풍선 사라짐
      this.scene.tweens.add({
        targets: this.container,
        alpha: 0,
        duration: 200,
        onComplete: () => this.container.setVisible(false),
      });
      this.onEnd?.();
    }
  }

  private showLine() {
    // 미리 줄바꿈을 계산해 둬서, 타이핑 도중 단어가 윗줄↔아랫줄로 튀지 않게 함
    this.fullText = this.text.getWrappedText(this.lines[this.index]).join('\n');
    this.text.setText('');
    this.arrow.setVisible(false);
    this.isTyping = true;

    let count = 0;
    this.typing?.remove();
    this.typing = this.scene.time.addEvent({
      delay: TYPE_SPEED,
      repeat: this.fullText.length - 1,
      callback: () => {
        count++;
        this.text.setText(this.fullText.slice(0, count));
        const ch = this.fullText[count - 1];
        if (ch.trim() && count % 2 === 1) playTypeSound(); // 두 글자마다 "톡"
        if (count >= this.fullText.length) this.finishTyping();
      },
    });
  }

  private finishTyping() {
    this.typing?.remove();
    this.text.setText(this.fullText);
    this.isTyping = false;
    this.arrow.setVisible(true);
  }
}

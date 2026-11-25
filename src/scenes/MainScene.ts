import Phaser from 'phaser';
import { playClickSound } from '../clickSound';
import { PIXEL_FONT_STACK } from '../fonts';
import { t } from '../i18n';
import { addLanguageButton } from '../ui/languageButton';

// 메인 화면: start_no_text.png 배경 + 버튼 2개
export class MainScene extends Phaser.Scene {
  constructor() {
    super('Main');
  }

  preload() {
    this.load.image('start', 'assets/images/main/start_no_text.png');
    this.load.image('btnPerfectTarget', 'assets/images/main/btn_perfect_target_v2.png');
    this.load.image('btnStillCute', 'assets/images/main/btn_still_cute_v2.png');
    this.load.image('startLogo', 'assets/images/main/startbutton.png');
    this.load.image('yoojung1', 'assets/images/common/yoojung1.png');

    // 다른 화면에서 쓸 이미지도 처음에 미리 불러오기
    // (화면을 넘길 때마다 서버에서 받으면, 서버가 꺼져 있을 때 배경이 사라짐)
    this.load.image('background1', 'assets/images/onboarding/background1.jpg');
    this.load.image('cardgameBackground', 'assets/images/cardgame/cardgame_background.png');
    this.load.image('cardBack', 'assets/images/cardgame/cardgame_back.png');
    for (const face of ['frontcard1', 'frontcard2', 'frontcard3', 'frontcard4', 'frontcard6']) {
      this.load.image(face, `assets/images/cardgame/${face}.png`);
    }
    this.load.image('frontcard5', 'assets/images/cardgame/frontcard5_clear.png'); // 검은 모서리를 투명하게 만든 사본
    this.load.image('perfect', 'assets/images/cardgame/perfect.png');
    this.load.image('boardBackground', 'assets/images/arrowgame/board_backgound.png');
    this.load.image('boardYoojung', 'assets/images/arrowgame/board_yoojung.png');
    this.load.image('roomBackground', 'assets/images/dressup/room_background.png');
    this.load.image('closetClosed', 'assets/images/dressup/closet_closed.png');
    this.load.image('closetOpen', 'assets/images/dressup/closet_open.png');
    this.load.image('dressBase', 'assets/images/dressup/base.png');
  }

  create() {
    // 개발용 바로가기: 주소 뒤에 ?scene=DressUp 처럼 붙이면 그 화면부터 시작 (처음 한 번만)
    // 화면 이름: Game(온보딩), CardGame(카드), RunGame(보드 점프), DressUp(옷 입히기)
    const jumpTo = new URLSearchParams(location.search).get('scene');
    if (jumpTo && !this.registry.get('jumped') && this.scene.get(jumpTo)) {
      this.registry.set('jumped', true);
      this.scene.start(jumpTo);
      return;
    }

    const { width, height } = this.scale;

    // 배경을 비율 유지한 채 화면 가운데에 맞춤
    const bg = this.add.image(width / 2, height / 2, 'start');
    const bgScale = Math.min(width / bg.width, height / bg.height);
    bg.setScale(bgScale);

    // 버튼 설정 (배경 원본 1622x970 기준)
    // 두 버튼은 같은 크기로, 화면 가운데를 기준으로 좌우 대칭 배치
    const BUTTON_WIDTH = 400; // 버튼 가로 길이
    const BUTTON_HEIGHT = 130; // 버튼 세로 길이
    const BUTTON_Y = 550; // 버튼 세로 위치 (커지면 아래로)
    const BUTTON_GAP = 40; // 두 버튼 사이 간격
    const STILL_CUTE_ANGLE = -0.5; // Still Cute 버튼 기울기 (음수: 시계 반대 방향, 단위: 도)
    const STILL_CUTE_WIDTH = 380; // Still Cute 버튼 가로 길이 (Perfect Target은 BUTTON_WIDTH)

    // 배경 원본 좌표를 화면 좌표로 바꾸기
    const left = bg.x - bg.displayWidth / 2;
    const top = bg.y - bg.displayHeight / 2;
    const centerX = bg.width / 2;

    // GAME START 로고: 배경 속 글자 위에 겹쳐 놓고, 마우스 올리면 커짐
    const LOGO_X = 808; // 로고 가운데 가로 위치
    const LOGO_Y = 315; // 로고 가운데 세로 위치
    const LOGO_WIDTH = 904; // 로고 가로 길이 (세로는 비율에 맞춰 자동)
    const logo = this.add.image(left + LOGO_X * bgScale, top + LOGO_Y * bgScale, 'startLogo');
    logo.setScale((LOGO_WIDTH / logo.width) * bgScale);
    this.addHoverEffect(logo);

    // GAME START 클릭하면 게임 화면으로 이동
    logo.input!.cursor = 'pointer';
    logo.on('pointerup', () => {
      playClickSound();
      this.scene.start('Game');
    });

    // 캐릭터 (비장의 무기 버튼 왼쪽)
    const CHAR_X = 190; // 캐릭터 가운데 가로 위치
    const CHAR_Y = 600; // 캐릭터 가운데 세로 위치
    const CHAR_HEIGHT = 450; // 캐릭터 세로 길이 (가로는 비율에 맞춰 자동)
    // 발 쪽을 기준점으로 잡아서, 발은 제자리에 두고 몸이 좌우로 흔들리게 함
    const character = this.add.image(left + CHAR_X * bgScale, top + (CHAR_Y + CHAR_HEIGHT / 2) * bgScale, 'yoojung1');
    character.setOrigin(0.5, 1);
    character.setScale((CHAR_HEIGHT / character.height) * bgScale);

    // 살랑살랑 효과: 좌우로 살짝 기울었다 돌아오기를 반복
    const SWAY_ANGLE = 4; // 기울어지는 각도 (도)
    const SWAY_TIME = 900; // 한쪽으로 기우는 데 걸리는 시간 (1000 = 1초)
    character.setAngle(-SWAY_ANGLE);
    this.tweens.add({
      targets: character,
      angle: SWAY_ANGLE,
      duration: SWAY_TIME,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });

    // 캐릭터를 누르면 누른 자리에서 하트 뿅뿅 (투명한 부분은 눌러도 반응 없음)
    character.setInteractive({ pixelPerfect: true });
    character.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.popHearts(pointer.worldX, pointer.worldY));

    const placeButton =(key: string, x: number, buttonWidth: number) =>
      this.add
        .image(left + x * bgScale, top + BUTTON_Y * bgScale, key)
        .setDisplaySize(buttonWidth * bgScale, BUTTON_HEIGHT * bgScale);

    // 가운데 선에서 간격의 절반씩 떨어뜨려 배치 (너비가 달라도 간격은 유지)
    const perfectTargetBtn = placeButton('btnPerfectTarget', centerX - BUTTON_GAP / 2 - BUTTON_WIDTH / 2, BUTTON_WIDTH); // 왼쪽
    const stillCuteBtn = placeButton('btnStillCute', centerX + BUTTON_GAP / 2 + STILL_CUTE_WIDTH / 2, STILL_CUTE_WIDTH) // 오른쪽
      .setAngle(STILL_CUTE_ANGLE);

    // 버튼 클릭 시 이동할 링크
    this.linkButton(perfectTargetBtn, 'https://youtu.be/wOWJslOeJrQ?si=YM-xU548W6Gc3SRF');
    this.linkButton(stillCuteBtn, 'https://youtu.be/tNLlSWU1uzE?si=HbCAKn26j-TH3Pp7');

    // 언어 바꾸기 버튼 (오른쪽 위)
    addLanguageButton(this);

    // 저작권 안내 (맨 아래 가운데, 작고 흐리게)
    this.add
      .text(left + centerX * bgScale, top + 950 * bgScale, t('main.copyright'), {
        fontFamily: PIXEL_FONT_STACK,
        fontSize: '22px',
        color: '#ffffff',
      })
      .setOrigin(0.5, 1)
      .setAlpha(0.6); // 흐린 정도 (0 = 안 보임, 1 = 선명)
  }

  // 하트 뿅뿅: (x, y)에서 작은 픽셀 하트 여러 개가 위로 떠오르며 사라짐
  private popHearts(x: number, y: number) {
    const COUNT = 3; // 한 번에 나오는 하트 개수
    const RISE = 160; // 떠오르는 높이
    const DURATION = 1300; // 사라지기까지 걸리는 시간 (1000 = 1초)

    for (let i = 0; i < COUNT; i++) {
      const heart = this.add
        .image(x + Phaser.Math.Between(-50, 50), y + Phaser.Math.Between(-20, 20), this.makeHeartTexture())
        .setDepth(10)
        .setScale(0);
      const size = Phaser.Math.FloatBetween(0.8, 1.4);
      this.tweens.add({ targets: heart, scale: size, duration: 150, delay: i * 60, ease: 'Back.Out' });
      this.tweens.add({
        targets: heart,
        y: heart.y - RISE - Phaser.Math.Between(0, 60),
        x: heart.x + Phaser.Math.Between(-90, 90),
        delay: i * 60,
        duration: DURATION,
        ease: 'Sine.Out',
        onComplete: () => heart.destroy(),
      });
      // 떠오르는 동안은 또렷하게, 마지막 절반 동안 서서히 사라짐
      this.tweens.add({ targets: heart, alpha: 0, delay: i * 60 + DURATION / 2, duration: DURATION / 2 });
    }
  }

  // 픽셀 하트 그림을 한 번만 만들어 두고 계속 재사용
  private makeHeartTexture() {
    const KEY = 'pixelHeart';
    if (this.textures.exists(KEY)) return KEY;

    const HEART = [
      '.KK...KK.',
      'KPPK.KPPK',
      'KPWPKPPPK',
      'KPPPPPPPK',
      '.KPPPPPK.',
      '..KPPPK..',
      '...KPK...',
      '....K....',
    ];
    const COLORS: Record<string, number> = { K: 0x1b1430, P: 0xff5fae, W: 0xffffff };
    const UNIT = 7; // 픽셀 한 칸 크기 (클수록 하트가 커짐)

    const g = this.make.graphics({}, false);
    HEART.forEach((row, r) =>
      [...row].forEach((ch, c) => {
        if (!COLORS[ch]) return;
        g.fillStyle(COLORS[ch]).fillRect(c * UNIT, r * UNIT, UNIT, UNIT);
      }),
    );
    g.generateTexture(KEY, HEART[0].length * UNIT, HEART.length * UNIT);
    g.destroy();
    return KEY;
  }

  // 마우스를 올리면 살짝 커지고, 벗어나면 원래대로
  private addHoverEffect(target: Phaser.GameObjects.Image) {
    const HOVER_SCALE = 1.05; // 커지는 정도 (1.05 = 5%)
    const baseX = target.scaleX;
    const baseY = target.scaleY;
    const scaleTo = (ratio: number) => {
      this.tweens.killTweensOf(target);
      this.tweens.add({ targets: target, scaleX: baseX * ratio, scaleY: baseY * ratio, duration: 120, ease: 'Quad.Out' });
    };

    target.setInteractive();
    target.on('pointerover', () => scaleTo(HOVER_SCALE));
    target.on('pointerout', () => scaleTo(1));
  }

  // 버튼 효과 + 클릭하면 새 탭에서 링크 열기
  private linkButton(btn: Phaser.GameObjects.Image, url: string) {
    const HOVER_SCALE = 1.05; // 마우스를 올렸을 때 크기 (1.05 = 5% 커짐)
    const PRESS_SCALE = 0.95; // 눌렀을 때 크기 (0.95 = 5% 작아짐)
    const PRESS_TINT = 0xcccccc; // 눌렀을 때 어두워지는 정도 (0xffffff = 원래 색)

    const baseX = btn.scaleX;
    const baseY = btn.scaleY;
    const scaleTo = (ratio: number, duration: number) => {
      this.tweens.killTweensOf(btn);
      this.tweens.add({ targets: btn, scaleX: baseX * ratio, scaleY: baseY * ratio, duration, ease: 'Quad.Out' });
    };

    btn.setInteractive({ useHandCursor: true });

    // 마우스 올리면 살짝 커짐, 벗어나면 원래대로
    btn.on('pointerover', () => scaleTo(HOVER_SCALE, 120));
    btn.on('pointerout', () => {
      btn.clearTint();
      scaleTo(1, 120);
    });

    // 누르는 동안 작아지고 어두워짐
    btn.on('pointerdown', () => {
      btn.setTint(PRESS_TINT);
      scaleTo(PRESS_SCALE, 60);
    });

    // 손을 떼면 다시 커지면서 링크 열기
    btn.on('pointerup', () => {
      btn.clearTint();
      scaleTo(HOVER_SCALE, 100);
      playClickSound();
      window.open(url, '_blank');
    });
  }
}

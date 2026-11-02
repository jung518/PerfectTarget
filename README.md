# PerfectTarget

Phaser 3 + TypeScript + Vite 프로젝트.

## 실행

```bash
npm install     # 처음 한 번만
npm run dev     # 개발 서버 실행 (http://localhost:8080)
npm run build   # 배포용 빌드 (dist/ 폴더 생성)
```

## 폴더 구조

```
public/assets/images/
  main/          메인 화면 (배경, GAME START 로고, 링크 버튼)
  onboarding/    온보딩 대화 화면
  cardgame/      카드 짝 맞추기 게임
  arrowgame/     화살 쏘기 게임
  dressup/       옷 입히기 게임
  common/        여러 화면에서 같이 쓰는 이미지 (캐릭터 등)
  etc/           아직 용도가 정해지지 않은 이미지
src/main.ts      게임 기본 설정
src/scenes/      화면별 코드
src/ui/          말풍선, 캐릭터, 뒤로 가기 버튼 등 공통 부품
```

이미지 불러오기 예: `this.load.image('cardBack', 'assets/images/cardgame/card_back.png');`

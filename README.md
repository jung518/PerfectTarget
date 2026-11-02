# PerfectTarget 🎯

유정이와 함께하는 작은 미니게임 모음이에요.
재미로 혼자 만든 **비공식 팬 프로젝트**이고, 상업적인 목적은 전혀 없어요.

## 게임 흐름

1. **메인 화면**: GAME START를 누르면 시작해요.
2. **온보딩**: 유정이가 게임을 소개해 줘요.
3. **카드 짝 맞추기**: 제한 시간 안에 같은 카드를 찾아요 (2라운드).
4. **보드 점프**: 달리는 보드 위에서 점프로 구멍을 피해 골인 지점까지 가요.
5. **옷 입히기**: 옷장에서 상의, 하의, 신발을 골라 유정이를 꾸며요.
6. **THE END**

## 실행 방법

```bash
npm install     # 처음 한 번만
npm run dev     # 개발 서버 실행 (http://localhost:8080)
npm run build   # 배포용 빌드 (dist/ 폴더 생성)
```

## 사용한 기술

- [Phaser 3](https://phaser.io/) + TypeScript + Vite
- 효과음은 파일 없이 코드(Web Audio API)로 만들었어요.

## 폴더 구조

```
public/assets/images/
  main/          메인 화면
  onboarding/    온보딩 대화 화면
  cardgame/      카드 짝 맞추기 게임
  arrowgame/     보드 점프 게임
  dressup/       옷 입히기 게임
  common/        여러 화면에서 같이 쓰는 이미지
src/scenes/      화면별 코드
src/ui/          말풍선, 캐릭터, 뒤로 가기 버튼 등 공통 부품
```

## 저작권 안내

- 이 프로젝트는 개인이 재미로 만든 비공식 팬 프로젝트이며, 판타지오(Fantagio)와는 관련이 없습니다.
- 게임에 쓰인 이미지는 ChatGPT로 만들었고, 캐릭터와 콘셉트의 저작권은 **판타지오 및 원저작자**에게 있습니다.
- 이미지는 이 프로젝트 안에서만 사용하며, 다른 곳에 복사하거나 다시 배포하지 말아 주세요.
- 픽셀 글꼴 [Galmuri](https://github.com/quiple/galmuri)는 SIL Open Font License 1.1을 따라요.

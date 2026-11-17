# PerfectTarget 🎯

선물용으로 만든 **미니 게임**입니다.
개인이 재미로 만든 **비공식 팬 프로젝트**이며, 상업적인 목적은 없습니다.

- **플레이하기**: [perfect-target.vercel.app](https://perfect-target.vercel.app/)
- **제작 기간**: 2일
- **제작 방식**: Claude AI 활용

## 게임 흐름

| 순서 | 화면 | 내용 |
| --- | --- | --- |
| 1 | 메인 화면 | GAME START를 누르면 게임이 시작됩니다. |
| 2 | 온보딩 | 캐릭터가 게임을 소개합니다. |
| 3 | 카드 짝 맞추기 | 제한 시간 안에 같은 카드를 찾습니다. (2라운드) |
| 4 | 보드 점프 | 달리는 보드 위에서 점프로 구멍을 피해 골인 지점까지 이동합니다. |
| 5 | 옷 입히기 | 옷장에서 상의, 하의, 신발을 골라 캐릭터를 꾸밉니다. |
| 6 | THE END | 게임이 끝납니다. |

## 사용한 기술

- [Phaser 3](https://phaser.io/) + TypeScript + Vite
- 효과음은 별도 파일 없이 코드(Web Audio API)로 구현했습니다.

## 실행 방법

```bash
npm install     # 처음 한 번만
npm run dev     # 개발 서버 실행 (http://localhost:8080)
npm run build   # 배포용 빌드 (dist/ 폴더 생성)
```

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
- 게임에 쓰인 이미지는 ChatGPT로 만들었으며, 캐릭터와 콘셉트의 저작권은 **판타지오 및 원저작자**에게 있습니다.

## 사용한 리소스

- 픽셀 글꼴 [Galmuri](https://github.com/quiple/galmuri): SIL Open Font License 1.1
- 파비콘 해바라기 그림 [Twemoji](https://github.com/jdecked/twemoji): CC BY 4.0

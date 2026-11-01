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
  backgrounds/   배경
  characters/    캐릭터
  items/         아이템
src/main.ts      게임 기본 설정
```

이미지 불러오기 예: `this.load.image('player', 'assets/images/characters/player.png');`

// 레트로 픽셀 한글 글꼴 "갈무리11" 불러오기 (무료 글꼴, OFL 라이선스)
// 11픽셀 기준으로 만든 글꼴이라 11의 배수 크기(22px, 33px, 44px)에서 가장 또렷함
import galmuri11Url from 'galmuri/dist/Galmuri11.woff2?url';
import galmuri11BoldUrl from 'galmuri/dist/Galmuri11-Bold.woff2?url';

export const PIXEL_FONT = 'Galmuri11';

// 갈무리11 굵게(Bold)에는 일본어(가나·한자)가 없어서, 보통 굵기 파일을 다른 이름으로 한 번 더 등록해 둠
// → 굵은 글자에 없는 글자는 브라우저가 이 글꼴에서 찾아 굵게 흉내 내서 그림 (같은 파일이라 추가 다운로드 없음)
const PIXEL_FONT_FALLBACK = 'Galmuri11Kana';

// 글자에 쓰는 글꼴 목록 (앞에서부터 찾고, 없으면 다음 글꼴)
export const PIXEL_FONT_STACK = `${PIXEL_FONT}, ${PIXEL_FONT_FALLBACK}, sans-serif`;

export async function loadFonts() {
  const fonts = [
    new FontFace(PIXEL_FONT, `url(${galmuri11Url})`, { weight: '400' }),
    new FontFace(PIXEL_FONT, `url(${galmuri11BoldUrl})`, { weight: '700' }),
    new FontFace(PIXEL_FONT_FALLBACK, `url(${galmuri11Url})`, { weight: '400' }),
  ];
  for (const font of await Promise.all(fonts.map((f) => f.load()))) {
    document.fonts.add(font);
  }
}

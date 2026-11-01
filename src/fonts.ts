// 레트로 픽셀 한글 글꼴 "갈무리11" 불러오기 (무료 글꼴, OFL 라이선스)
// 11픽셀 기준으로 만든 글꼴이라 11의 배수 크기(22px, 33px, 44px)에서 가장 또렷함
import galmuri11Url from 'galmuri/dist/Galmuri11.woff2?url';
import galmuri11BoldUrl from 'galmuri/dist/Galmuri11-Bold.woff2?url';

export const PIXEL_FONT = 'Galmuri11';

export async function loadFonts() {
  const fonts = [
    new FontFace(PIXEL_FONT, `url(${galmuri11Url})`, { weight: '400' }),
    new FontFace(PIXEL_FONT, `url(${galmuri11BoldUrl})`, { weight: '700' }),
  ];
  for (const font of await Promise.all(fonts.map((f) => f.load()))) {
    document.fonts.add(font);
  }
}

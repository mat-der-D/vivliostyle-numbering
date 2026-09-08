// @ts-check
// 脚注を本全体で通し番号にする版。
// tools/make-note-offsets.mjs が .vivliostyle/ を写して gen/ を作り、
// 各ファイルの <head> に counter-reset: footnote N を注入する。
// npm run build:continuous-notes がこの手順をまとめている。
import { defineConfig } from '@vivliostyle/cli';
import base from './vivliostyle.config.js';

export default defineConfig({
  title: 'Vivliostyle で番号を振る（脚注は本全体で通し）',
  author: base.author,
  language: base.language,
  size: base.size,
  browser: base.browser,
  image: base.image,
  // gen/ の中身はコンパイル済みの HTML なので、テーマは既に <link> されている。
  entryContext: 'gen',
  entry: base.entry
    .filter((e) => typeof e === 'string')
    .map((e) => e.replace(/\.md$/, '.html')),
});

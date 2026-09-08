#!/usr/bin/env node
/**
 * 脚注を本全体で通し番号にするための前処理。
 *
 * 脚注番号は Vivliostyle 内蔵の footnote カウンターで採番される。これは文書
 * カウンターなのでファイル境界でリセットされ、CSS だけでは通しにできない。
 * ファイルごとに「それまでに出てきた脚注の数」を数えて
 *   :root { counter-reset: footnote N; }
 * を注入すれば通し番号になる。
 *
 * オフセットは本文が変わるたびに計算し直す必要があるので、手で維持せず
 * ビルドの一部にする。
 *
 *   npm run build                    (まず .vivliostyle/ を作る)
 *   npm run build:continuous-notes   (この前処理 → gen/ を入力に組み直す)
 */
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC = '.vivliostyle';
const OUT = 'gen';

if (!existsSync(SRC)) {
  console.error(`${SRC}/ がありません。先に npm run build を実行してください。`);
  process.exit(1);
}

// entry の並び順は設定ファイルが持っている。順序が狂えばオフセットも狂う。
const config = (await import(pathToFileURL(join(process.cwd(), 'vivliostyle.config.js')).href)).default;
const files = config.entry
  .map((e) => (typeof e === 'string' ? e : e.path))
  .filter(Boolean)
  .map((p) => p.replace(/\.md$/, '.html'));

// スタイルシートや画像への相対パスを保つため、丸ごと写してから書き換える
rmSync(OUT, { recursive: true, force: true });
cpSync(SRC, OUT, { recursive: true });

let offset = 0;
for (const file of files) {
  const path = join(OUT, file);
  if (!existsSync(path)) continue;
  const html = readFileSync(path, 'utf8');
  writeFileSync(
    path,
    html.replace(/<\/head>/i, `<style>:root { counter-reset: footnote ${offset}; }</style></head>`),
  );
  console.log(`${file}: counter-reset: footnote ${offset}`);
  // VFM の gcpm モードは <span class="footnote" … role="doc-footnote"> を出す。
  // class と role の両方を数えると二重になるので片方だけにし、さらに
  // 「タグの開きから始まっていること」を条件にする。そうしないと、
  // 本文が role="doc-footnote" という文字列を説明のために含んでいるだけで
  // 数に入ってしまう (この本がまさにそれ)。
  offset += (html.match(/<(?:span|aside)[^>]*role="doc-footnote"/g) ?? []).length;
}
console.log(`\n${OUT}/ に書き出した。脚注は本全体で ${offset} 個。`);

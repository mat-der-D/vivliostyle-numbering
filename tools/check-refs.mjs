#!/usr/bin/env node
/**
 * Vivliostyle 相互参照リンター
 *
 * Vivliostyle は target-counter() / target-text() の参照先が見つからないとき、
 * 警告を出さずに "??" を出力してビルドを成功させる (vivliostyle.js の
 * counters.ts に "TODO more reasonable placeholder?" として残っている挙動)。
 * 壊れた参照は PDF を目視するまで気づけないので、ビルド後の HTML を走査して
 * 参照先の解決可否を機械的に確かめる。
 *
 *   usage: node tools/check-refs.mjs <ビルド後のディレクトリ> [--pdf out.pdf]
 *                                    [--ignore-file <path>]
 *          (ディレクトリは vivliostyle build が生成する .vivliostyle/ など)
 *
 * --ignore-file には、PDF の "??" 走査で無視してよい行の目印を1行1件で書く。
 * 本文が "??" という文字列そのものを扱っている本では、これが無いと
 * 自分の本文に反応してしまう。検査には例外が必要な場面があり、
 * 例外は暗黙にせず明示的に書く。
 *
 * 終了コード: 0 = 問題なし / 1 = 壊れた参照あり
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
const dir = resolve(args[0] ?? '.vivliostyle');
const pdfIdx = args.indexOf('--pdf');
const pdfPath = pdfIdx >= 0 ? args[pdfIdx + 1] : null;
const ignoreIdx = args.indexOf('--ignore-file');
const ignorePatterns =
  ignoreIdx >= 0
    ? readFileSync(resolve(args[ignoreIdx + 1]), 'utf8')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'))
    : [];

const htmlFiles = readdirSync(dir)
  .filter((f) => /\.x?html?$/i.test(f))
  .filter((f) => statSync(join(dir, f)).isFile());

if (htmlFiles.length === 0) {
  console.error(`HTML が見つかりません: ${dir}`);
  process.exit(2);
}

/** ファイル名 -> そのファイルが持つ id の集合 */
const idsByFile = new Map();
/** { from, line, href, file, hash } の配列 */
const refs = [];

for (const file of htmlFiles) {
  const text = readFileSync(join(dir, file), 'utf8');
  const ids = new Set();
  for (const m of text.matchAll(/\sid\s*=\s*("([^"]*)"|'([^']*)')/g)) {
    ids.add(m[2] ?? m[3]);
  }
  idsByFile.set(file, ids);

  const lines = text.split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/<a\b[^>]*\shref\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
      const href = m[2] ?? m[3];
      if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(href)) continue;
      const [target, hash] = href.split('#');
      refs.push({
        from: file,
        line: i + 1,
        href,
        file: target ? basename(target) : file,
        hash: hash ? decodeURIComponent(hash) : null,
      });
    }
  });
}

const broken = [];
for (const ref of refs) {
  if (!idsByFile.has(ref.file)) {
    broken.push({ ...ref, why: `参照先のファイルが出版物に含まれていない (${ref.file})` });
  } else if (ref.hash && !idsByFile.get(ref.file).has(ref.hash)) {
    broken.push({ ...ref, why: `参照先の id が存在しない (#${ref.hash})` });
  }
}

console.log(`走査: ${htmlFiles.length} ファイル / ${refs.length} 個のリンク`);
for (const b of broken) {
  console.log(`  NG ${b.from}:${b.line}  href="${b.href}"  — ${b.why}`);
}

let pdfHits = 0;
if (pdfPath) {
  try {
    const text = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' });
    text.split('\n').forEach((line, i) => {
      if (line.includes('??') && !ignorePatterns.some((pat) => line.includes(pat))) {
        pdfHits++;
        console.log(`  NG ${basename(pdfPath)} 内に未解決の参照 "??" — ${i + 1} 行目: ${line.trim()}`);
      }
    });
  } catch {
    console.log('  (pdftotext が無いので PDF の "??" 走査はしていない)');
  }
}

if (broken.length === 0 && pdfHits === 0) {
  console.log('壊れた参照は見つからなかった。');
  process.exit(0);
}
console.log(`\n壊れた参照: ${broken.length} 件 / PDF 内の "??": ${pdfHits} 件`);
process.exit(1);

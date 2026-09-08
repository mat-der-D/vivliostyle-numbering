# Vivliostyle で番号を振る

[Vivliostyle](https://vivliostyle.org) で本に番号を振るための実装例です。
**この本自身が、本の中で説明している方法で組まれています。**
書いてあることが実際にそう出ているかを、そのページで確かめられます。

主題は**番号**です。章・節・定理・図・式の番号、ページ番号、脚注と文献の番号、
そしてそれらを指す相互参照。目次もファイル分割も、
「番号がどこまで届くか」という同じ話の延長として扱っています。

```bash
npm install
npm run build      # book.pdf を作り、そのあと相互参照の検査を回す
npm run preview    # ブラウザで確認する
```

## 何を見ればいいか

| 見るもの | 中身 |
| --- | --- |
| `theme/book.css` | **実装の本体。**節番号が本の章立てと対応している |
| `vivliostyle.config.js` | `entry` の並び、VFM のオプション、目次の加工 |
| `tools/` | ビルドに付ける検査と前処理 |
| `book.pdf`（ビルドすると出る） | 出来上がり |

## 押さえている設計判断

1. **1ファイル1章。** 分割の単位を「改ページしてよい単位」に一致させる
2. **番号の出所を階層で分ける。** 部・章・付録はページ制御カウンター（`@page` の中で増やす。
   ファイル境界を越える）、節・定理・図・式は文書カウンター（ファイル境界でリセットされる）。
   その境界をファイル分割の境界に重ねる
3. **通し番号の難易度は「番号の源を1ファイルに集約できるか」で決まる。**
   文献は集まるので素直に通り、脚注は散らばるのでビルド時のオフセット注入が必要になる
4. **規約は CSS より先に決める。** 目次の加工に使えるのは `href` と `id` だけなので、
   ファイル名に種別（`-part-` / `-ch-` / `-app-`）、id に接頭辞、除外印は `-nx`
5. **ビルドは「ビルド + 検査」で1つ。** Vivliostyle は壊れた参照を警告なしに `??` にするので、
   目視ではなく機械で確かめる

## 構成

```
manuscript/          原稿 (VFM の Markdown)。frontmatter の class: が <body> に付く
  00-preface.md      前付け。ページ番号はローマ数字
  05-part-theme.md   第I部 テーマの考え方
  0x-ch-theme-*.md     theme-base の作りと、制御の5つの型
  10-part-*.md       第II部 番号と参照
  1x-ch-*.md           カウンターの設計 / 相互参照
  20-part-*.md       第III部 文書の組み立て
  2x-ch-*.md           ファイル分割 / 目次としおり / 注と文献
  9x-app-*.md        付録（落とし穴の一覧 / 検査のしかた）
  9x-{lof,bib}.md    図一覧・参考文献
  99-colophon.md     奥付
theme/
  book.css           番号・参照・目次・柱の規約
  cover.css          表紙だけの上書き
tools/
  check-refs.mjs         壊れた相互参照を見つける
  check-refs.ignore      PDF の "??" 走査の例外
  make-note-offsets.mjs  脚注を本全体で通し番号にする前処理
```

## 脚注を本全体で通し番号にする

既定は「章ごとに 1 から」です。本全体で通しにする版も試せます。

```bash
npm run build                    # 先に .vivliostyle/ を作る
npm run build:continuous-notes   # gen/ を作って組み直す → book-continuous-notes.pdf
```

`book.pdf` の脚注が 1, 1, 1, 2 と章ごとに戻るのに対し、
`book-continuous-notes.pdf` は 1, 2, 3, 4 と通ります。

## 動作環境

| | |
| --- | --- |
| Vivliostyle CLI | 11.2.0 |
| Vivliostyle Core | 2.45.0 |
| `@vivliostyle/theme-base` | 2.1.1 |
| Chrome | 152.0.7977.54 |

本文に書いてある挙動は、この組み合わせで実際にビルドして確かめたものです。

## ライセンス

[MIT](LICENSE)。図版は本リポジトリで作成した SVG です。

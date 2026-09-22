---
class: chapter
title: theme-base はどう作られているか
---

# theme-base はどう作られているか {#ch-theme-design}

この本は `@vivliostyle/theme-base` の上に組んでいます。以降の部で出てくる注意書きは、ほとんどが**このテーマの作りから出てくる帰結**です。先に考え方を押さえておくと、急に出てきた話ではなく知っていることの応用として読めます。

## 値はすべて変数に出してある {#sec-design-vars}

`--vs-*` の変数は、パッケージに入っている `css-variables.json` に一覧があり、**1772個**あります（3.0.0）。セレクタと宣言はテーマが持ち、**著者は値だけを差し替える**という作りです。

`content` まで変数になっているのが特徴で、マージンボックスの `content` だけで30個あります。16個のボックスそれぞれの変数に、見開きの内側・外側で指定する14個が加わります。

```css
/* theme-base の書き方 */
@page { @bottom-center { content: var(--vs-page--mbox-bottom-center-content, ''); } }
```
```css
/* 著者はこう書く。セレクタを書かないので、詳細度の勝負にならない */
:root { --vs-page--mbox-bottom-center-content: counter(page); }
```

## 規則は一度だけ書き、何に効かせるかを変数で決める {#sec-design-switch}

設計の中心です。同じ考えを `@page` にも当てています。

```css
/* 規則はこの1つだけ */
@page :nth(1) {
  counter-increment: var(--vs-page--doc-counter-increment, vs-counter-doc);
}
/* 「何を増やすか」は別の @page から変数で渡す */
@page chapter-document { --vs-page--doc-counter-increment: vs-counter-doc vs-counter-chapter; }
@page toc-document     { --vs-page--doc-counter-increment: vs-counter-doc 0; }
```

目次の文書だけ `0` を渡して数えない、という書き方になっています。

## 文書の役割を名前付きページに変える {#sec-design-role}

VFM の frontmatter に書いた `class:` は `<html>` と `<body>` の両方に付きます。theme-base はそれを名前付きページに変換します。表紙と目次は CLI が作るので class を付けられず、役割属性で拾っています。どれも `html` と `body` の両方に当たるように書いてあります。

```css
:is(html, body):is(.chapter, [role='doc-chapter']) { page: chapter-document; }
:is(html, body):has([role='doc-toc'])              { page: toc-document; }
:is(html, body):has([role='doc-cover'])            { page: cover-document; }
```

`preface` `appendix` `colophon` `bibliography` など、DPUB-ARIA の役割名も同じ扱いです。

## 番号は数えるところまで。出すのは著者 {#sec-design-count}

theme-base はカウンターを22個持っていますが、**出し方まで決めているのは一部だけ**です。

| カウンター | 数える | 既定で出る |
| --- | --- | --- |
| `vs-counter-doc` / `-part` / `-chapter` | ○ | **×** |
| `vs-counter-appendix` | ○ | ○（appendix モジュール） |
| `vs-counter-sections` / `-sec-h1`〜`-h6` | ○ | × |
| `vs-counter-toc` | ○ | × |
| `vs-counter-fig` / `-tbl` / `-lst` / `-eq` / `-thm` / `-cite` | ○ | ○（それぞれのモジュール） |
| `vs-counter-footnote` / `-endnote` / `-endnote-call` / `-sidenote` | ○ | ○ |

<div class="thm" id="thm-theme-counts">
<p>部と章の番号は、theme-base が数えてはいるが<strong>どこにも出していない</strong>。
<code>counter(vs-counter-chapter)</code> と書いた箇所は theme-base の中に1つも無い。</p>
</div>

図や定理の番号の前に章番号を付けるための変数（`--vs-crossref-marker-counter-prefix`）もありますが、既定では空で、何を入れるかは著者が決めます。

出すのは著者の仕事です。この本がどう出しているかは[](11-ch-counters.md#ch-counters){.ref-ch}で扱います。

## 足せないものには足す口が用意してある {#sec-design-hooks}

`counter-reset` のように**値を並べて書くしかない**プロパティは、同じセレクタで上書きするとテーマ側の指定が全部消えます。theme-base はそのための変数を予約しています。

```css
body          { counter-reset: … var(--vs-document-root-counter-reset,); }
@page :nth(1) { counter-reset: var(--vs-document-first-page-counter-reset,); }
@page :first  { counter-reset: … var(--vs-first-page-counter-reset,); }
```

`body` の `counter-reset` は、図・表・文献・節などの機能ごとのリセット（`--vs-figure--root-counter-reset` など）と、著者用の `--vs-document-root-counter-reset` を並べたものです。直接書くと、これら全部が消えます。

## 読み込む範囲を選べる {#sec-design-parts}

パッケージは、入口とモジュールに分かれています。入口は必ず読み込んで、モジュールは使うものだけを選んで並べます。

| 読み込むもの | 中身 |
| --- | --- |
| `@vivliostyle/theme-base` | 入口。リセット・変数の既定値・HTML 要素の基本スタイル |
| `@vivliostyle/theme-base/page` など | 機能ごとのモジュール。1つずつ `@import` する |

モジュールは page・section・toc・footnote・endnote・sidenote・figure・table・listing・equation・theorem・appendix・citation・math・prism の15個です（ほかに、外部リンクを脚注にする `footnote/external-links` があります）。

この本は page・section・toc・footnote・figure・citation の6つを読み込んでいます。**部・章・付録・定理・式の番号は自分で振っているので、appendix・theorem・equation は読み込みません。**読み込むと、同じ番号を2か所で持つことになります（[](07-ch-theme-control.md#sec-control-defer){.ref-sec}）。

```css
/* theme/book.css の先頭 */
@import '@vivliostyle/theme-base';
@import '@vivliostyle/theme-base/page';
@import '@vivliostyle/theme-base/section';
/* … */
```

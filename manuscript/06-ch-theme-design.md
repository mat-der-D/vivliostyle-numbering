---
class: chapter
title: theme-base はどう作られているか
---

# theme-base はどう作られているか {#ch-theme-design}

この本は `@vivliostyle/theme-base` の上に組んでいます。以降の部で出てくる注意書きは、ほとんどが**このテーマの作りから出てくる帰結**です。先に考え方を押さえておくと、急に出てきた話ではなく知っていることの応用として読めます。

## 値はすべて変数に出してある {#sec-design-vars}

`--vs-*` の変数が **343個定義され、479箇所から参照**されています。セレクタと宣言はテーマが持ち、**著者は値だけを差し替える**という作りです。

`content` まで変数になっているのが特徴で、ページまわりだけで16箇所あります。

```css
/* theme-base の書き方 */
@page { @bottom-center { content: var(--vs-page--mbox-content-bottom-center); } }
```
```css
/* 著者はこう書く。セレクタを書かないので、詳細度の勝負にならない */
:root { --vs-page--mbox-content-bottom-center: counter(page); }
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

VFM の frontmatter に書いた `class:` は `<html>` と `<body>` の両方に付きます。theme-base はそれを名前付きページに変換します。表紙と目次は CLI が作るので class を付けられず、役割属性で拾っています。

```css
html.chapter, body.chapter   { page: chapter-document; }
body:has([role='doc-toc'])   { page: toc-document; }
body:has([role='doc-cover']) { page: cover-document; }
```

`preface` `appendix` `colophon` `bibliography` など、DPUB-ARIA の役割名も同じ扱いです。

## 番号は数えるところまで。出すのは著者 {#sec-design-count}

theme-base はカウンターを15個持っていますが、**出し方まで決めているのは一部だけ**です。

| カウンター | 数える | 既定で出る |
| --- | --- | --- |
| `vs-counter-doc` / `-part` / `-chapter` | ○ | **×** |
| `vs-counter-sections` / `-sec-h1`〜`-h6` | ○ | × |
| `vs-counter-toc` | ○ | × |
| `vs-counter-fig` / `-tbl` / `-cite` | ○ | ○ |
| `vs-counter-footnote` | ○ | ○ |

<div class="thm" id="thm-theme-counts">
<p>部と章の番号は、theme-base が数えてはいるが<strong>どこにも出していない</strong>。
<code>counter(vs-counter-chapter)</code> と書いた箇所は theme-base の中に1つも無い。</p>
</div>

出すのは著者の仕事です。この本がどう出しているかは[](11-ch-counters.md#ch-counters){.ref-ch}で扱います。

## 足せないものには足す口が用意してある {#sec-design-hooks}

`counter-reset` のように**値を並べて書くしかない**プロパティは、同じセレクタで上書きするとテーマ側の指定が全部消えます。theme-base はそのための変数を予約しています。

```css
body          { counter-reset: … var(--vs-document-root-counter-reset,); }
@page :nth(1) { counter-reset: var(--vs-document-first-page-counter-reset,); }
@page :first  { counter-reset: … var(--vs-first-page-counter-reset,); }
```

`meta-properties.css` に明記があります。

```
Caution: Don't set value directly otherwise all other counters will be ignored.
  OK: :root { --vs-document-root-counter-reset: foo bar; }
  NG: :root { counter-reset: foo bar; }
```

## 読み込む範囲を選べる {#sec-design-parts}

| 入口 | 中身 |
| --- | --- |
| `theme-basic.css` | 基本のみ（meta-properties, reset, basic） |
| `theme-all.css`（既定） | 基本 + partial 8本 |
| `css/partial/*.css` | 個別に `@import` できる |

partial は crossref・endnote・footnote・footnote-external-link・page・section・toc・utility-classes。**番号まわりを全部自分で書くなら `theme-basic.css` を選ぶ**という手もあります。この本は `theme-all.css`（既定）を使い、番号だけ書き足しています。

---
class: chapter
title: テーマを制御する5つの型
---

# テーマを制御する5つの型 {#ch-theme-control}

[](06-ch-theme-design.md#ch-theme-design){.ref-ch}の作りを踏まえると、テーマに手を入れるやり方は5つに整理できます。**上から順に試します。下へ行くほどテーマと戦うことになります。**

## 型1 — 変数を差し替える {#sec-control-swap}

第一手。セレクタを書かないので詳細度の勝負になりません。

```css
:root {
  --vs-page--size: A5;
  --vs-section--marker-display: inline;
}
```

変数は `<body>` などの要素にも書けます。文書の種別で値を変えたいときに使います。

```css
body.chapter  { --vs-section--marker-content: counter(chapter) '.' counters(vs-counter-sections, '.'); }
body.appendix { --vs-section--marker-content: counter(appendix, upper-alpha) '.' counters(vs-counter-sections, '.'); }
```

`none` を渡せば、その部分を丸ごと消せます。theme-base はマージンボックスに既定で `content: ''` を入れているので、何も書かなくても上中央のボックスが作られます。上中央のボックスがあると左右のボックスは同じ幅に割られ、長い柱が途中で折り返します。

```css
@page chap { --vs-page--mbox-top-center-content: none; }
```

## 型2 — 変数に足す {#sec-control-add}

`counter-reset` 系。**直接書くとテーマ側の指定が消えます。**

```css
:root { --vs-document-root-counter-reset: thmlike eq; }   /* OK */
body  { counter-reset: thmlike eq; }                      /* NG: vs-counter-* のリセットが全部消える */
```

なぜリセットが必要なのかは[](11-ch-counters.md#sec-counters-reset){.ref-sec}で扱います。

## 型3 — テーマの仕組みに寄せる {#sec-control-defer}

**同じ番号を二重に持たない。**theme-base が既に数えているものは、そのカウンターを使います。

```css
/* 節番号は vs-counter-sections に寄せる。自前の sec は立てない */
body.chapter { --vs-section--marker-content: counter(chapter) '.' counters(vs-counter-sections, '.'); }
a.ref-sec::before { content: target-counters(attr(href url), vs-counter-sections, '.') '節'; }
```

図・表・文献も同じです（`vs-counter-fig` / `-tbl` / `-cite`）。VFM が出す `<figure><img>` と `ol.cite-items > li` に、theme-base の増分がそのまま当たります。

## 型4 — テーマの仕組みを無効にする {#sec-control-disable}

寄せた結果、一部だけ都合が悪いとき。`none` は初期値なので「何もしない」に戻ります。

```css
/* h1 の節は数えない */
section:has(> h1:first-child) { counter-increment: none; }
/* 最初の h2 の節で桁を作らない */
section:has(> h1:first-child) > section:has(> h2:first-child):first-of-type { counter-reset: none; }
/* 既定では番号を出さない */
:root { --vs-section--marker-content: none; }
```

## 型5 — 同じセレクタで上書きする {#sec-control-override}

最後の手。**詳細度を合わせないと負けます。**この本は2か所で引っかかりました。

```css
/* theme-base は html にも書いている。body だけ上書きすると html 側が残る */
html.chapter, body.chapter { page: chap; }

/* theme-base の目次規則は :is(#toc, [role='doc-toc']) 前置き。
   :is() は最も詳細な引数 (#toc) の詳細度を取るので id 相当になる */
:is(#toc, [role='doc-toc']) li > a::after {
  content: leader('.') target-counter(attr(href url), bodypage);
}
```

## @page の counter-increment は共存できない {#sec-control-page}

型のどれにも収まらない、独立した注意点です。**`@page` 規則もふつうのカスケードに従う**ので、`counter-increment` は1つの値に決まります。

<div class="thm" id="thm-page-exclusive">
<p>theme-base の <code>@page :nth(1) { counter-increment: var(…) }</code> と、
自分の <code>@page 名前 { counter-increment: … }</code> は両方書けない。名前付きページのほうが詳細度が高いので自分の宣言が勝ち、
<strong>変数を読んでいる側の宣言ごと消える。</strong></p>
</div>

付録のカウンターで実際に測りました。

| 自分の `@page app { counter-increment: bodypage }` | 出力 |
| --- | --- |
| 残したまま | `付録 0`（変数が使われず 0 のまま） |
| 外す | `付録 A` |

したがって二択になります。

- **乗る** — `@page 名前 { --vs-page--doc-counter-increment: … }` と書き、
  `@page` に自分の `counter-increment` を一切書かない
- **自分で書く** — `@page 名前:nth(1 of 名前) { counter-increment: … }` と書く

**この本は後者です。**理由は本文の通しページ番号で、これは全ページで増やす必要がありますが、`@page :nth(1)` は各文書の1ページ目にしか当たりません。その時点で `@page` に自分の `counter-increment` を書かざるを得ないので、部・章・付録も同じ流儀にそろえています。

> **どちらを選ぶかは最初に決めます。**併用すると、どのページでどちらが勝っているかを追えなくなります。

## この本がどこでどの型を使ったか {#sec-control-map}

| ぶつかった場所 | 症状 | 使った型 |
| --- | --- | --- |
| 判型 | 既定値がなく A5 にならない | 設定の `size:`（または型1） |
| 名前付きページ | `body` だけ上書きして章番号が全部 0 | 型5 |
| 節番号 | 二重に持ちかけた | 型3 |
| 節番号の桁 | h1 の分の階層が余分 | 型4 |
| 節番号の表示 | `display: none` で出ない | 型1 |
| 前付け・後付けの見出し | 裸の `0` が出る | 型1 |
| 図・文献の番号 | 二重に持っていた | 型3 |
| 図のキャプションの番号 | 番号と本文のあいだの余白が消える | 型1 |
| 柱 | 左右のボックスが等幅に割られて折り返す | 型1 |
| 目次のページ番号 | `:is(#toc,…)` に負ける | 型5 |
| 文書カウンターのリセット | `body` に直接書くと全部消える | 型2 |
| 付録のカウンター | `@page` の `counter-increment` が競合 | 流儀を統一 |

---
class: chapter
title: 目次としおり
---

# 目次としおり {#ch-toc}

## 目次はビルド時に Node 側で組まれる {#sec-toc-when}

`entry` に `{ rel: 'contents' }` を置くと、CLI が目次文書を作ります。このとき CLI は**コンパイル済みの HTML を JSDOM で読み、`h1`〜`h6` を集めて見出しの `innerHTML` を写します。**

ここから2つのことが出てきます。

<div class="thm" id="thm-toc-nonumber">
<p>CSS カウンターで付けた番号は DOM に無いので、目次には自動では入らない。</p>
</div>

<div class="thm" id="thm-toc-noclass">
<p>目次の加工に使えるのは <code>href</code> と <code>id</code> だけで、クラス名は取れない。</p>
</div>

## 番号は目次側で振り直す {#sec-toc-number}

目次のリンクから `target-counter()` で本文と同じカウンターを参照します。**同じカウンターを参照するので、本文の番号と必ず一致します。**

```css
[role='doc-toc'] li[data-kind='chapter'][data-section-level='1'] > a::before {
  content: '第' target-counter(attr(href url), chapter) '章　';
}
[role='doc-toc'] a::after {
  content: leader('.') target-counter(attr(href url), bodypage);
}
```

前付けだけは別の系列のページ番号を出すので、`data-kind='front'` で切り替えます。

## 種別の手掛かりを作る {#sec-toc-kind}

既定の目次出力には文書の種別が残りません。「h1 が1つだけの文書は `<li>` ごと畳んで中身を持ち上げる」という規則があるため、前付け・部・章・付録がすべて同じ階層に並びます。

そこで `toc.transformSectionList` で `data-kind` を付けます。種別は**出力ファイル名から**判定します。ファイル名に種別を埋める規約が、ここで効いてきます。

```js
const kindOf = (href = '') =>
  /-part-/.test(href) ? 'part'
  : /-ch-/.test(href) ? 'chapter'
  : /-app-/.test(href) ? 'appendix' : 'back';
```

## 部の下に章をぶら下げる {#sec-toc-nest}

既定では部と章は同じ階層に並びます。`toc.transformDocumentList` で入れ子にします。

<div class="rem">
<p><code>&lt;li&gt;</code> の直下に <code>&lt;li&gt;</code> を置くと、
<strong>印刷される目次は崩れないのに PDF のしおりから章がまるごと消えます。</strong>
Vivliostyle の目次ウィジェットが <code>[role=treeitem] &gt; a[href]</code> を辿るためです。必ず <code>&lt;li&gt; &gt; &lt;ol&gt; &gt; &lt;li&gt;</code> の形にします。</p>
</div>

## 特定の見出しを目次から外す {#sec-toc-exclude}

クラス名が取れないので、**id の規約**で表します。この本は末尾 `-nx` にしています。

```js
const isExcluded = (section) => /-nx$/.test(section.id ?? '');
```

[](11-ch-counters.md#ch-counters){.ref-ch}の最後の節がこれで消えています。落とした見出しは PDF のしおりからも消えます。

## PDF のしおり {#sec-toc-bookmark}

しおりは目次から自動生成され、階層もそのまま反映されます。部を親にした入れ子も反映されます。

ただし**しおりの見出し文字列には CSS の生成内容が一切入りません。**静的な文字列でも入りません。番号をしおりに出したければ、番号を実際の DOM テキストにするしかなく、そうすると本文の自動採番と出所が2つに分かれます。**この本は番号なしのしおりを選んでいます。**

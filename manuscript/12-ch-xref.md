---
class: chapter
title: 相互参照
---

# 相互参照 {#ch-xref}

`target-counter()` / `target-counters()` / `target-text()` は、**ファイルをまたいでも、前方参照でも、ページ制御カウンターに対しても解決します。**書き方は同一ファイル内と変わりません。

## 書き方 {#sec-xref-how}

Markdown 側は、本文を空にしたリンクにクラスを付けるだけです。

```markdown
[](11-ch-counters.md#ch-counters){.ref-ch} を参照。
```

`.md` から `.html` への書き換えは `vfm: { rewriteRelativeHrefExtensions: true }` が行います。

CSS 側でクラスごとに表示形式を決めます。

```css
a.ref-ch::before  { content: '第' target-counter(attr(href url), chapter) '章'; }
a.ref-fig::before { content: '図 ' target-counter(attr(href url), chapter) '.'
                                   target-counter(attr(href url), fig); }
```

## 実際に参照してみる {#sec-xref-demo}

- 章への参照（別ファイル・後方）: [](11-ch-counters.md#ch-counters){.ref-ch}
- 章への参照（別ファイル・前方）: [](22-ch-toc.md#ch-toc){.ref-ch}
- 節への参照（入れ子カウンター）: [](11-ch-counters.md#sec-counters-nested){.ref-sec}
- 図への参照: [](11-ch-counters.md#fig-counters-layer){.ref-fig}
- 式への参照: [](11-ch-counters.md#eq-counters-1){.ref-eq}
- 付録への参照: [](90-app-pitfalls.md#app-pitfalls){.ref-app}
- ページ位置への参照: [](11-ch-counters.md#ch-counters){.ref-page}
- 見出し文言の引用: [](11-ch-counters.md#ch-counters){.ref-title}
- 文献への参照: [](96-bib.md#ref-gcpm){.ref-cite}

同じ対象を何度参照しても同じ番号になります:[](11-ch-counters.md#ch-counters){.ref-ch}、[](11-ch-counters.md#ch-counters){.ref-ch}。

範囲を指す関数はないので、参照を2つ並べて書きます:式[](11-ch-counters.md#eq-counters-1){.ref-eq}〜[](11-ch-counters.md#eq-counters-2){.ref-eq}。

## 参照側に種類名を出す {#sec-xref-kind}

定理・補題・系が番号系列を共有していると、番号だけでは種類が分かりません。`target-text()` の第2引数に `before` を渡すと、**参照先の `::before` を丸ごと引けます。**種類名も番号も名前も自動で付きます。

```css
a.ref-thm::before { content: target-text(attr(href url), before); }
```

- [](11-ch-counters.md#thm-crossfile){.ref-thm}
- [](11-ch-counters.md#lem-nofix){.ref-thm}
- [](11-ch-counters.md#cor-nogeneral){.ref-thm}
- [](11-ch-counters.md#dfn-page-counter){.ref-thm}

<div class="rem">
<p>このとき、番号と本文のあいだの区切りを <code>content</code> の中の空白文字で
作ってはいけません。参照側にもその空白が付いてきます。区切りは
<code>margin-inline-end</code> で作ります。</p>
</div>

名前まで取り出してほしくないときは、id の接頭辞から種類名を出して番号だけ参照します:[](11-ch-counters.md#thm-crossfile){.ref-thmnum}。

## id を置く位置 {#sec-xref-id}

守らないと番号が1つずれる規則が2つあります。

<div class="thm" id="thm-id-placement">
<p>id は、<strong>その位置でカウンターが既に増えている</strong>要素に置く。</p>
</div>

<div class="thm" id="thm-target-text">
<p><code>target-text()</code> は対象要素の全テキストを返すので、
その文字列だけを持つ要素に置く。</p>
</div>

定理なら `.thm` の div、見出しなら `h1`/`h2` そのもの、図なら `<figcaption>` です（図の番号は親の `<figure>` で増えるので、子のキャプションの位置ではもう増えています）。`<section>` に付けると、`target-counter()` は増える前の値を返し、`target-text()` は節の本文をまるごと返します。

**id は必ず手で書きます。**VFM の自動 id は見出しの文言から作られるので、見出しを直すと参照が警告も出さずに壊れます。

## 壊れた参照は無警告で `??` になる {#sec-xref-broken}

参照先の id やファイルが存在しないとき、Vivliostyle は `??` を出力して**警告もエラーも出さずにビルドを成功させます。**検出のしかたは[](91-app-checks.md#app-checks){.ref-app}にあります。

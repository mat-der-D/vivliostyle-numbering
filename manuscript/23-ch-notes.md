---
class: chapter
title: 注と文献
---

# 注と文献 {#ch-notes}

## 通し番号の難易度を決めるもの {#sec-notes-principle}

<div class="thm" id="thm-notes-source">
<p>通し番号の難易度は、<strong>番号の源を1ファイルに集約できるか</strong>で決まる。</p>
</div>

一覧が1か所にあるもの（文献・記号一覧・年表）は素直に通ります。本文に散らばるもの（脚注）は、ビルド時のオフセット注入が必要です。

## 脚注 {#sec-notes-footnote}

脚注番号は、どのカウンターで採番するかでリセットの単位が変わります[^kind]。

| 採番方法 | リセットの単位 |
| --- | --- |
| 自前のカウンター（`counter-reset` を書かない） | ページごと |
| `theme-base` の既定（`vs-counter-footnote`） | ファイルごと |
| Vivliostyle 内蔵の `footnote` カウンター | ファイルごと |
| 内蔵 + ビルド時のオフセット注入 | 本全体で通し |

[^kind]: 自前のカウンターがページごとに戻るのは、`float: footnote` の要素が本文の流れから外れるためです。本文側に確認用の要素を置くと、その値は常に 0 のままです。

theme-base の既定がファイルごとなのは、`body` で `vs-counter-footnote` をリセットしているからです。

この本は1ファイル1章なので、内蔵カウンターを使って**章ごとに 1 から**にしています[^this]。この脚注が 2 番なのは、そのためです。

[^this]: `--vs-footnote--call-content: counter(footnote)` で `theme-base` の既定を上書きしています。

本全体で通しにしたいときは、ファイルごとに「それまでの注の数」を数えて`:root { counter-reset: footnote N }` を注入します。本文が変わるたびに計算し直すので、**手で維持せずビルドの一部にします。**`tools/make-note-offsets.mjs` と `npm run build:continuous-notes` がその実装です。

記号（\*, †, ‡）での採番は、`counter-reset` を書かない自前のカウンターと噛み合います。ページごとに戻るからです。

```css
@counter-style note-symbols {
  system: fixed; symbols: '*' '\2020' '\2021' '\A7' '\B6'; suffix: '';
}
.footnote::footnote-call { content: counter(note, note-symbols); }
```

## 同じ注を複数箇所から呼ぶ {#sec-notes-multi}

`float: footnote` では注が呼び出し位置に埋め込まれるので、呼び出しは1つしか持てません。複数箇所から呼ぶには意味づけの書き方（`role="doc-noteref"` / `role="doc-footnote"`）を使い、呼び出し番号は注そのものから参照します。

```css
a[role='doc-noteref']::before { content: target-counter(attr(href url), footnote); }
```

`::footnote-call` は意味づけ脚注では生成されないので、この形が必要です。注は呼び出しの直後に置きます。まとめて末尾に置くと番号がずれます。

## 章末注 {#sec-notes-endnote}

VFM の既定（`footnote: 'pandoc'`）は注を文書末尾に集めますが、**呼び出し側の番号は `<sup>1</sup>` という素のテキストとして DOM に書かれます。**注の側は `<ol>` の既定のリスト番号です。どちらも CSS カウンターではないので、そのままでは CSS で動かせません。

本全体で通しにするなら、両方を自前のカウンターに置き換えたうえでオフセットを注入します。

## 参考文献 {#sec-notes-cite}

文献はリストが1ファイルに収まるので、**番号の源がその中で完結します。**本文からは `target-counter()` で参照するだけで、ファイルをまたいでも書き方は変わりません。

```css
ol.cite-items > li { counter-increment: cite; }
ol.cite-items > li::before { content: '[' counter(cite) ']'; }
a.ref-cite::before { content: '[' target-counter(attr(href url), cite) ']'; }
```

GCPM の仕様[](96-bib.md#ref-gcpm){.ref-cite}と生成内容の仕様[](96-bib.md#ref-content){.ref-cite}を引用してみます。同じ文献をもう一度引用しても同じ番号です: [](96-bib.md#ref-gcpm){.ref-cite}。

**本文に出てきた順に番号を振ることはできません。**番号はリスト側の並び順で決まるので、出現順にしたければビルド時にリストを並べ替えます。

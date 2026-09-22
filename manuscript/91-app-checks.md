---
class: appendix
title: 検査のしかた
---

# 検査のしかた {#app-checks}

沈黙する壊れ方に対しては、**ビルドを「ビルド + 検査」で1つにします。**この本の `package.json` は `postbuild` で検査を回しています。

```json
"build": "vivliostyle build",
"postbuild": "npm run check",
"check": "node tools/check-refs.mjs .vivliostyle --pdf book.pdf"
```

## 相互参照の検査 {#sec-checks-refs}

`tools/check-refs.mjs` は、ビルド後の HTML を走査して次を確かめます。

1. 参照先のファイルが出版物に含まれているか
2. 参照先の id が実在するか
3. 出来上がった PDF に未解決の `??` が残っていないか

3 が必要なのは、**HTML 側の検査だけでは見つからない壊れ方がある**からです。1・2 で確かめるのはリンク先があるかどうかだけで、CSS の側で参照が解決されたかどうかは、出来上がった PDF を見るまで分かりません。

## 足すべき検査 {#sec-checks-more}

同じ発想で、少なくともあと3つあります。

- ページごとの判型が揃っているか（`pdfinfo -l`）
- しおりの木が目次の木と一致しているか（`mutool show outline`）
- `entryContext` のファイル一覧と `entry` 配列が一致しているか

## 検査そのものも確かめる {#sec-checks-meta}

<div class="thm" id="thm-check-the-check">
<p>沈黙する壊れ方に検査を足すときは、<strong>検査の側が偽の警報を出さないこと</strong>も確かめる。</p>
</div>

この本のもとになった調査では、参照を全数照合する検出器の最初の版が空白を潰してから比べていたため、ページ番号が直前の数字と繋がって**78個の偽の食い違い**を出しました。差分が規則的に増えていたので気づけましたが、そのまま「Vivliostyle が壊れている」と読むところでした。

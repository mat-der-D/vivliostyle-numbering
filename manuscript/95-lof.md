---
class: backmatter
title: 図一覧
---

# 図一覧 {#lof}

図表の一覧を自動生成する仕組みはありません。CLI の目次生成は `h1`〜`h6` しか見ないためです。アンカーを並べ、番号・キャプション・ページを `target-*` で埋めます。

<ul class="lof">
<li><a href="11-ch-counters.html#fig-counters-layer"></a></li>
<li><a href="90-app-pitfalls.html#fig-app-blank"></a></li>
</ul>

付録の図は章番号ではなく付録記号で採番されているので、参照側も `a[href*='-app-']` で切り替えています。

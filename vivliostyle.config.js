// @ts-check
import { defineConfig } from '@vivliostyle/cli';
import { h } from 'hastscript';

/**
 * 目次から外す見出しの規約: id の末尾が -nx。
 * transformSectionList が受け取れるのは href と id だけで、クラス名は取れない。
 * だから「目次に出すかどうか」は id の規約で表す。
 */
const isExcluded = (section) => /-nx$/.test(section.id ?? '');

/**
 * 出力ファイル名から文書の種別を決める。
 * 既定の目次出力には文書の種別が残らない（h1 が1つの文書は <li> ごと畳まれる）ので、
 * CSS から番号の形式を切り替えるための手掛かりをここで作る。
 * ファイル名に種別を埋めておく規約が、そのまま効いてくる。
 */
const kindOf = (href = '') =>
  /-part-/.test(href) ? 'part'
  : /-ch-/.test(href) ? 'chapter'
  : /-app-/.test(href) ? 'appendix'
  : /^00-/.test(href) ? 'front'
  : 'back';

export default defineConfig({
  title: 'Vivliostyle で番号を振る',
  author: 'mat-der-D',
  language: 'ja',

  // 判型はここで指定する。テーマ側の既定 (--vs-page--size) は auto で、
  // 何も書かないと Letter で出る。
  size: 'A5',

  // 体裁は theme-base、番号・参照・目次・柱の規約は book.css に置く。層を混在させない。
  theme: ['@vivliostyle/theme-base', './theme/book.css'],

  browser: 'chrome@152.0.7977.54',
  image: 'ghcr.io/vivliostyle/cli:11.2.0',
  output: 'book.pdf',
  entryContext: 'manuscript',

  vfm: {
    // [](11-ch-counters.md#id) と書いたリンクを .html に書き換える
    rewriteRelativeHrefExtensions: true,
    // 画像に付けた {#id} を <img> ではなく <figcaption> に付ける。
    // figcaption は counter-increment を持つ要素でもあり、target-text() で
    // キャプション本文を取り出す対象でもある。id はここに無いと番号が1つずれる。
    assignIdToFigcaption: true,
    captionlessImagePolicy: 'figure-with-figcaption',
    // 脚注はページ下部に出す (GCPM の float: footnote)
    footnote: 'gcpm',
  },

  entry: [
    // 表紙のエントリに theme を書かないと、生成される表紙 HTML に
    // スタイルシートが1枚も入らず、そのページだけ判型と余白が変わる。
    // エントリの theme は全体の theme を「置き換える」ので、全部並べ直す。
    { rel: 'cover', theme: ['@vivliostyle/theme-base', './theme/book.css', './theme/cover.css'] },
    '00-preface.md',
    { rel: 'contents', title: '目次' },
    '05-part-theme.md',
    '06-ch-theme-design.md',
    '07-ch-theme-control.md',
    '10-part-numbering.md',
    '11-ch-counters.md',
    '12-ch-xref.md',
    '20-part-structure.md',
    '21-ch-splitting.md',
    '22-ch-toc.md',
    '23-ch-notes.md',
    '90-app-pitfalls.md',
    '91-app-checks.md',
    '95-lof.md',
    '96-bib.md',
    '99-colophon.md',
  ],
  cover: { src: 'images/cover.svg' },

  toc: {
    title: '目次',
    sectionDepth: 2,

    // 節リスト: 除外規約に合う見出しを落とし、種別を data-kind に載せる
    transformSectionList: (nodeList) => (propsList) =>
      h('ol', nodeList.flatMap((node, i) =>
        isExcluded(node) ? [] : [
          h('li', { 'data-section-level': node.level, 'data-kind': kindOf(node.href) }, [
            h('a', { href: node.href }, [{ type: 'raw', value: node.headingHtml }]),
            ...[propsList[i].children].flat(),
          ]),
        ])),

    // 文書リスト: 部の <li> の下に、続く章の <li> をぶら下げる。
    // <li> の直下に <li> を置くと、印刷される目次は崩れないのに
    // PDF のしおりから章がまるごと消える。必ず <li> > <ol> > <li> の形にする。
    transformDocumentList: (nodeList) => (propsList) => {
      const itemsOf = (i) =>
        [propsList[i].children].flat()
          .flatMap((e) => (e.type === 'element' && e.tagName === 'ol' ? e.children : [e]))
          .filter((e) => e.type === 'element');
      const items = [];
      let partList = null;
      nodeList.forEach((doc, i) => {
        const lis = itemsOf(i);
        const kind = kindOf(doc.href);
        if (kind === 'part') {
          partList = h('ol', []);
          const li = lis[0];
          if (!li) return;
          li.children = [...li.children, partList];
          items.push(li);
        } else if (partList && kind === 'chapter') {
          partList.children.push(...lis);
        } else {
          partList = null;
          items.push(...lis);
        }
      });
      return h('ol', items);
    },
  },
});

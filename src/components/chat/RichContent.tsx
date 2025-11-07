"use client";

import React, { useEffect, useMemo, useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

// MathJax fallback loader
let mathJaxLoading = false;
let mathJaxReady: Promise<void> | null = null;
function ensureMathJax() {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).MathJax) return Promise.resolve();
  if (mathJaxReady) return mathJaxReady;
  mathJaxLoading = true;
  // Configure MathJax before loading
  (window as any).MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
    },
    svg: { fontCache: 'global' }
  };
  mathJaxReady = new Promise<void>((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
  return mathJaxReady;
}

interface RichContentProps {
  text: string;
  isStreaming?: boolean;
}

// Attempt to dynamically import Prism if available
let PrismRef: any = null;
const loadPrism = async () => {
  try {
    // @ts-ignore - optional dependency
    const Prism = (await import('prismjs')).default || (await import('prismjs'));
    // Avoid loading individual language components in test/typecheck to prevent TS module resolution errors
    PrismRef = Prism;
  } catch (e) {
    // Prism not installed - fallback without highlighting
    PrismRef = null;
  }
};

// Utility: escape HTML
const escapeHtml = (s: string) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

// Parse content into segments: code blocks, block math, inline math, inline code, and text
function parseSegments(input: string) {
  type Segment = 
    | { type: 'code'; lang: string | null; content: string }
    | { type: 'math-block'; content: string }
    | { type: 'math-inline'; content: string }
    | { type: 'inline-code'; content: string }
    | { type: 'text'; content: string };

  const segments: Segment[] = [];

  if (!input) return segments;

  // First, extract fenced code blocks so inner $ aren't treated as math
  const codeRegex = /```(\w+)?\n[\s\S]*?```/g;
  const placeholders: { key: string; seg: Segment }[] = [];
  let temp = input;
  let idx = 0;
  temp = temp.replace(codeRegex, (m) => {
    const langMatch = m.match(/^```(\w+)?/);
    const lang = (langMatch && langMatch[1]) ? langMatch[1] : null;
    const content = m.replace(/^```\w*\n?/,'').replace(/```$/,'');
    const key = `__CODE_BLOCK_${idx++}__`;
    placeholders.push({ key, seg: { type: 'code', lang, content } });
    return key;
  });

  // Now parse block math $$...$$ (greedy across lines)
  const mathBlockRegex = /\$\$([\s\S]*?)\$\$/g;
  temp = temp.replace(mathBlockRegex, (m, p1) => {
    const key = `__MATH_BLOCK_${idx++}__`;
    placeholders.push({ key, seg: { type: 'math-block', content: p1.trim() } });
    return key;
  });

  // Next inline code `...` (avoid interfering with inline math)
  const inlineCodeRegex = /`([^`]+)`/g;
  temp = temp.replace(inlineCodeRegex, (m, p1) => {
    const key = `__INLINE_CODE_${idx++}__`;
    placeholders.push({ key, seg: { type: 'inline-code', content: p1 } });
    return key;
  });

  // Then inline math $...$
  const inlineMathRegex = /\$(.+?)\$/g;
  temp = temp.replace(inlineMathRegex, (m, p1) => {
    const key = `__MATH_INLINE_${idx++}__`;
    placeholders.push({ key, seg: { type: 'math-inline', content: p1 } });
    return key;
  });

  // Remaining text becomes a single text segment (preserve newlines)
  segments.push({ type: 'text', content: temp });

  // Finally, split text by placeholders order and rebuild
  function explodeByPlaceholders(text: string): Segment[] {
    if (placeholders.length === 0) return [{ type: 'text', content: text }];
    // Sort by index order of appearance in text
    const order = placeholders
      .map(ph => ({ ...ph, pos: text.indexOf(ph.key) }))
      .sort((a, b) => a.pos - b.pos);
    const result: Segment[] = [];
    let cursor = 0;
    for (const ph of order) {
      if (ph.pos > cursor) {
        result.push({ type: 'text', content: text.slice(cursor, ph.pos) });
      }
      result.push(ph.seg);
      cursor = ph.pos + ph.key.length;
    }
    if (cursor < text.length) {
      result.push({ type: 'text', content: text.slice(cursor) });
    }
    return result;
  }

  return explodeByPlaceholders(temp);
}

export default function RichContent({ text, isStreaming }: RichContentProps) {
  const [prismReady, setPrismReady] = useState(false);
  useEffect(() => {
    loadPrism().then(() => setPrismReady(true));
  }, []);

  const segments = useMemo(() => parseSegments(text), [text]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
      {segments.map((seg, i) => {
        switch (seg.type) {
          case 'text': {
            // Lightweight Markdown: headings, bold, italic, lists, links
            const toMarkdownHtml = (raw: string) => {
              // Escape first
              let s = escapeHtml(raw);
              const renderTable = (rows: string[]) => {
                if (rows.length === 0) return '';
                // Support optional alignment row like: | --- | :---: | ---: |
                const cells = rows.map(r => r.split('|').map(c => c.trim()));
                let header: string[] | null = null;
                let align: string[] = [];
                if (cells.length > 1 && /^:?-{3,}:?$/.test(cells[1][0] || '')) {
                  header = cells[0];
                  align = cells[1].map(a => {
                    const left = a.startsWith(':');
                    const right = a.endsWith(':');
                    if (left && right) return 'center';
                    if (right) return 'right';
                    return 'left';
                  });
                }
                const bodyStart = header ? 2 : 0;
                const th = header ? `<thead><tr>${header.map((h,i)=>`<th style=\"text-align:${align[i]||'left'}\">${h}<\/th>`).join('')}</tr></thead>` : '';
                const tb = `<tbody>${cells.slice(bodyStart).map(row => `<tr>${row.map((c,i)=>`<td style=\"text-align:${align[i]||'left'}\">${c}<\/td>`).join('')}</tr>`).join('')}</tbody>`;
                return `<table>${th}${tb}</table>`;
              };
              // Links [text](url)
              s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline">$1<\/a>');
              // Bold **text**
              s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1<\/strong>');
              // Italic *text* or _text_
              s = s.replace(/(^|\s)\*([^*]+)\*(?=\s|$)/g, '$1<em>$2<\/em>');
              s = s.replace(/(^|\s)_([^_]+)_(?=\s|$)/g, '$1<em>$2<\/em>');
              // Process lines for headings, lists, blockquotes, task lists, and simple tables
              const lines = s.split(/\n/);
              const out: string[] = [];
              let inList = false;
              let inTaskList = false;
              let inTable = false;
              let tableBuffer: string[] = [];
              for (const line of lines) {
                const h = line.match(/^(#{1,6})\s+(.*)$/);
                const bq = line.match(/^>\s?(.*)$/);
                if (h) {
                  if (inList) { out.push('</ul>'); inList = false; }
                  if (inTaskList) { out.push('</ul>'); inTaskList = false; }
                  if (inTable) { out.push(renderTable(tableBuffer)); tableBuffer = []; inTable = false; }
                  const level = h[1].length;
                  out.push(`<h${level}>${h[2]}<\/h${level}>`);
                  continue;
                }
                if (bq) {
                  out.push(`<blockquote>${bq[1]}<\/blockquote>`);
                  continue;
                }
                const li = line.match(/^\s*[-*]\s+(.*)$/);
                const task = line.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/);
                const tableRow = line.match(/^\s*\|(.+)\|\s*$/);
                if (task) {
                  if (inList) { out.push('</ul>'); inList = false; }
                  if (!inTaskList) { out.push('<ul class="task-list">'); inTaskList = true; }
                  const checked = /x/i.test(task[1]);
                  out.push(`<li><input type=\"checkbox\" disabled ${checked ? 'checked' : ''}/> ${task[2]}<\/li>`);
                  continue;
                }
                if (li) {
                  if (inTaskList) { out.push('</ul>'); inTaskList = false; }
                  if (!inList) { out.push('<ul>'); inList = true; }
                  out.push(`<li>${li[1]}<\/li>`);
                  continue;
                }
                if (tableRow) {
                  if (inList) { out.push('</ul>'); inList = false; }
                  if (inTaskList) { out.push('</ul>'); inTaskList = false; }
                  inTable = true;
                  tableBuffer.push(tableRow[1]);
                  continue;
                }
                if (inList) { out.push('</ul>'); inList = false; }
                if (inTaskList) { out.push('</ul>'); inTaskList = false; }
                if (inTable) { out.push(renderTable(tableBuffer)); tableBuffer = []; inTable = false; }
                out.push(line === '' ? '<br />' : `<p>${line}<\/p>`);
              }
              if (inList) out.push('</ul>');
              if (inTaskList) out.push('</ul>');
              if (inTable) { out.push(renderTable(tableBuffer)); tableBuffer = []; inTable = false; }
              return out.join('\n');
            };
            return <span key={i} dangerouslySetInnerHTML={{ __html: toMarkdownHtml(seg.content) }} />;
          }
          case 'inline-code': {
            return (
              <code key={i} className="px-1 py-0.5 rounded bg-muted text-muted-foreground">
                {seg.content}
              </code>
            );
          }
          case 'math-inline': {
            try {
              return <InlineMath key={i} math={seg.content} />;
            } catch (e) {
              // Fallback to MathJax if KaTeX fails
              ensureMathJax().then(() => {
                // MathJax will process the page automatically
                // Alternative: (window as any).MathJax.typesetPromise?.();
                try { (window as any).MathJax?.typeset?.(); } catch {}
              });
              return <span key={i}>${seg.content}$</span>;
            }
          }
          case 'math-block': {
            try {
              return (
                <div key={i} className="my-2 overflow-x-auto">
                  <BlockMath math={seg.content} />
                </div>
              );
            } catch (e) {
              ensureMathJax().then(() => {
                try { (window as any).MathJax?.typeset?.(); } catch {}
              });
              return (
                <div key={i} className="my-2 overflow-x-auto">
                  <pre>$$ {seg.content} $$</pre>
                </div>
              );
            }
          }
          case 'code': {
            const lang = seg.lang || 'plaintext';
            const code = seg.content.replace(/\n$/,'');
            const highlighted = (() => {
              try {
                if (PrismRef && lang && PrismRef.languages[lang]) {
                  return PrismRef.highlight(code, PrismRef.languages[lang], lang);
                }
              } catch {}
              return escapeHtml(code);
            })();
            const copy = async () => {
              try { await navigator.clipboard.writeText(code); } catch {}
            };
            return (
              <div key={i} className="relative my-3">
                <button
                  onClick={copy}
                  className="absolute right-2 top-2 text-xs bg-muted px-2 py-1 rounded border hover:bg-background"
                  title="Copy"
                >
                  Copy
                </button>
                <pre className="overflow-x-auto rounded bg-black/90 text-white p-3 text-xs">
                  <code className={`language-${lang}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
                </pre>
              </div>
            );
          }
          default:
            return null;
        }
      })}
      {isStreaming && (
        <span className="inline-block w-2 h-2 bg-current rounded-full align-baseline animate-pulse ml-1" />
      )}
    </div>
  );
}

import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import sql from 'highlight.js/lib/languages/sql';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import diff from 'highlight.js/lib/languages/diff';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);

marked.setOptions({
  breaks: true,
  gfm: true,
});

const renderer = new marked.Renderer();

renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  let highlighted = text;
  const language = lang || '';
  if (language && hljs.getLanguage(language)) {
    try {
      highlighted = hljs.highlight(text, { language }).value;
    } catch {
      // fallback
    }
  } else {
    try {
      highlighted = hljs.highlightAuto(text).value;
    } catch {
      // fallback
    }
  }
  return `<pre class="group relative"><div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onclick="(async()=>{const c=this.closest('pre').querySelector('code').textContent;try{await navigator.clipboard.writeText(c);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)}catch{try{const t=document.createElement('textarea');t.value=c;t.style.cssText='position:fixed;opacity:0;left:-9999px';document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);this.textContent='Copied!';setTimeout(()=>this.textContent='Copy',2000)}catch{}}})()" class="px-2 py-1 text-xs rounded bg-bg-tertiary text-text-secondary hover:text-text-primary border border-border transition-colors">Copy</button></div><code class="hljs language-${language}">${highlighted}</code></pre>`;
};

marked.use({ renderer });

export function renderMarkdown(text: string): string {
  if (!text) return '';
  try {
    return marked.parse(text) as string;
  } catch {
    return `<p>${text.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</p>`;
  }
}

export function highlightAll(container: HTMLElement) {
  container.querySelectorAll('pre code:not(.hljs)').forEach((block) => {
    hljs.highlightElement(block as HTMLElement);
  });
}

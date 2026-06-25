import { getTranslations } from "next-intl/server";
import fs from "node:fs";
import path from "node:path";
import { remark } from "remark";
import html from "remark-html";

interface LegalPageProps {
  params: Promise<{ locale: string }>;
  contentPath: string;
}

/* eslint-disable security/detect-non-literal-fs-filename -- locale and contentPath are validated at build time */
async function getMarkdownContent(locale: string, contentPath: string): Promise<string> {
  const fullPath = path.join(
    process.cwd(),
    "src",
    "content",
    "legal",
    `${contentPath}-${locale}.md`,
  );
  return fs.readFileSync(fullPath, "utf-8");
}
/* eslint-enable security/detect-non-literal-fs-filename */

// Strip template-only meta so it never reaches the public page (presentation
// only — the source .md files stay intact for the owner's legal review):
//   1. YAML frontmatter (`--- lang: xx ---`)
//   2. the leading "owner notice" blockquote (a template/placeholder warning)
//   3. any trailing "DRAFT translation" appendix accidentally left in a file
function stripTemplateMeta(md: string): string {
  let s = md.replace(/^﻿?---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
  s = s.replace(/(?:^[ \t]*>.*(?:\r?\n|$))+/m, (block) =>
    /PLACEHOLDER|template|шаблон/i.test(block) ? "" : block,
  );
  s = s.replace(/\r?\n#{1,6}[^\n]*DRAFT[\s\S]*$/i, "\n");
  return s.replace(/^\s+/, "");
}

async function renderMarkdown(content: string): Promise<string> {
  const result = await remark().use(html).process(stripTemplateMeta(content));
  return String(result);
}

export default async function LegalPage({ params, contentPath }: LegalPageProps) {
  const { locale } = await params;
  const t = await getTranslations("legal");

  const titleKeyMap: Record<string, "privacyTitle" | "termsTitle" | "cookiesTitle"> = {
    privacy: "privacyTitle",
    terms: "termsTitle",
    "cookie-info": "cookiesTitle",
  };

  const title = t(titleKeyMap[contentPath] ?? "privacyTitle");
  const raw = await getMarkdownContent(locale, contentPath);
  const htmlString = await renderMarkdown(raw);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-[var(--ink)] sm:text-4xl">{title}</h1>
      <div
        className="prose prose-stone prose-headings:font-heading prose-headings:text-[var(--ink)] prose-a:text-[var(--ink)] mt-8 max-w-none text-[var(--ink-soft)]"
        dangerouslySetInnerHTML={{ __html: htmlString }}
      />
    </div>
  );
}

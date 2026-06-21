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

async function renderMarkdown(content: string): Promise<string> {
  const result = await remark().use(html).process(content);
  return String(result);
}

export default async function LegalPage({ params, contentPath }: LegalPageProps) {
  const { locale } = await params;
  const t = await getTranslations("legal");

  const titleKey = `${contentPath}Title` as "privacyTitle" | "termsTitle" | "cookiesTitle";

  const title = t(titleKey);
  const raw = await getMarkdownContent(locale, contentPath);
  const htmlString = await renderMarkdown(raw);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-foreground text-3xl font-semibold sm:text-4xl">{title}</h1>
      <div
        className="prose prose-invert mt-8 max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlString }}
      />
    </div>
  );
}

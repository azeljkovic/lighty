import {promises as fs} from "node:fs";
import path from "node:path";
import type {LoadContext, Plugin} from "@docusaurus/types";

export type SearchIndexItem = {
  description: string;
  headings: string[];
  id: string;
  permalink: string;
  text: string;
  title: string;
};

type FrontMatter = Record<string, string | boolean | number>;

const DOC_EXTENSION_PATTERN = /\.mdx?$/;

function parseFrontMatter(source: string): {
  body: string;
  frontMatter: FrontMatter;
} {
  if (!source.startsWith("---\n")) {
    return {body: source, frontMatter: {}};
  }

  const endIndex = source.indexOf("\n---", 4);

  if (endIndex === -1) {
    return {body: source, frontMatter: {}};
  }

  const frontMatterText = source.slice(4, endIndex).trim();
  const body = source.slice(endIndex + 4).trim();
  const frontMatter = Object.fromEntries(
    frontMatterText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf(":");

        if (separatorIndex === -1) {
          return [line, ""];
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();

        if (value === "true") {
          return [key, true];
        }

        if (value === "false") {
          return [key, false];
        }

        if (/^\d+$/.test(value)) {
          return [key, Number(value)];
        }

        return [key, value.replace(/^["']|["']$/g, "")];
      }),
  );

  return {body, frontMatter};
}

function toTitle(id: string): string {
  return id
    .split("/")
    .at(-1)!
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function stripMarkdown(source: string): string {
  return source
    .replace(/```[\w-]*\n([\s\S]*?)```/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[[^\]]*]\([^)]+\)/g, " ")
    .replace(/[#>*_~|:-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractHeadings(source: string): string[] {
  return source
    .split("\n")
    .map((line) => line.match(/^#{2,3}\s+(.+)$/)?.[1])
    .filter((heading): heading is string => Boolean(heading))
    .map((heading) => stripMarkdown(heading));
}

async function listDocFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, {withFileTypes: true});
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listDocFiles(entryPath);
      }

      return DOC_EXTENSION_PATTERN.test(entry.name) ? [entryPath] : [];
    }),
  );

  return files.flat();
}

function toDocId(docsDir: string, filePath: string): string {
  const relativePath = path.relative(docsDir, filePath);
  const withoutExtension = relativePath.replace(DOC_EXTENSION_PATTERN, "");
  const normalized = withoutExtension.split(path.sep).join("/");

  if (normalized.endsWith("/index")) {
    return normalized.slice(0, -"/index".length);
  }

  return normalized;
}

function toPermalink(id: string, slug: unknown): string {
  if (typeof slug === "string" && slug.length > 0) {
    return slug.startsWith("/") ? `/docs${slug}` : `/docs/${slug}`;
  }

  return `/docs/${id}`;
}

async function createSearchIndex(siteDir: string): Promise<SearchIndexItem[]> {
  const docsDir = path.join(siteDir, "docs");
  const files = await listDocFiles(docsDir);
  const items = await Promise.all(
    files.map(async (filePath) => {
      const source = await fs.readFile(filePath, "utf8");
      const {body, frontMatter} = parseFrontMatter(source);

      if (frontMatter.draft === true || frontMatter.unlisted === true) {
        return undefined;
      }

      const id = toDocId(docsDir, filePath);
      const title =
        typeof frontMatter.title === "string" ? frontMatter.title : toTitle(id);
      const description =
        typeof frontMatter.description === "string"
          ? frontMatter.description
          : "";

      return {
        description,
        headings: extractHeadings(body),
        id,
        permalink: toPermalink(id, frontMatter.slug),
        text: stripMarkdown(body),
        title,
      } satisfies SearchIndexItem;
    }),
  );

  return items
    .filter((item): item is SearchIndexItem => Boolean(item))
    .sort((a, b) => a.permalink.localeCompare(b.permalink));
}

export default function localSearchPlugin({
  siteDir,
}: LoadContext): Plugin<unknown> {
  return {
    name: "lighty-local-search",

    async loadContent() {
      return createSearchIndex(siteDir);
    },

    async contentLoaded({content, actions}) {
      actions.setGlobalData(content as SearchIndexItem[]);
    },
  };
}

import type { MarkdownBlock } from "@/lib/content/types";

export function parseMarkdownDocument(source: string): readonly MarkdownBlock[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let fence: { language: string; lines: string[] } | null = null;

  const flushParagraph = () => {
    const text = paragraph.join(" ").trim();
    if (text) {
      blocks.push({ type: "paragraph", text });
    }
    paragraph = [];
  };

  const flushList = () => {
    if (list && list.items.length > 0) {
      blocks.push({ type: "list", ...list });
    }
    list = null;
  };

  for (const line of lines) {
    if (fence) {
      if (/^```\s*$/.test(line)) {
        blocks.push({
          type: "code",
          language: fence.language,
          code: fence.lines.join("\n"),
        });
        fence = null;
      } else {
        fence.lines.push(line);
      }
      continue;
    }

    const openingFence = /^```([^`]*)\s*$/.exec(line);
    if (openingFence) {
      flushParagraph();
      flushList();
      fence = { language: openingFence[1]?.trim() || "text", lines: [] };
      continue;
    }

    const heading = /^(#{2,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const markers = heading[1] ?? "##";
      const text = heading[2] ?? "";
      blocks.push({
        type: "heading",
        level: markers.length as 2 | 3 | 4,
        text: text.trim(),
      });
      continue;
    }

    if (/^---\s*$/.test(line)) {
      flushParagraph();
      flushList();
      blocks.push({ type: "rule" });
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushParagraph();
      flushList();
      blocks.push({ type: "quote", text: quote[1]?.trim() || "" });
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(line);
    const unordered = /^[-*+]\s+(.+)$/.exec(line);
    if (ordered || unordered) {
      flushParagraph();
      const nextOrdered = Boolean(ordered);
      if (list && list.ordered !== nextOrdered) {
        flushList();
      }
      list ??= { ordered: nextOrdered, items: [] };
      list.items.push((ordered?.[1] ?? unordered?.[1] ?? "").trim());
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  if (fence) {
    blocks.push({
      type: "code",
      language: fence.language,
      code: fence.lines.join("\n"),
    });
  }

  return blocks;
}

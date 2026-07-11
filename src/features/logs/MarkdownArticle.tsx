import { Fragment, type ReactNode } from "react";

import type { MarkdownBlock } from "@/lib/content/types";
import { containsCjk } from "@/lib/typography";

type MarkdownArticleProps = Readonly<{
  blocks: readonly MarkdownBlock[];
}>;

type MarkdownHeadingProps = Readonly<{
  level: 2 | 3 | 4;
  text: string;
  children: ReactNode;
}>;

const inlinePattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;

function getSafeLink(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function renderInline(text: string): ReactNode {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = 0;

  for (const match of text.matchAll(inlinePattern)) {
    const token = match[0];
    const start = match.index ?? cursor;

    if (start > cursor) {
      nodes.push(
        <Fragment key={`text-${matchIndex.toString()}-before`}>
          {text.slice(cursor, start)}
        </Fragment>,
      );
    }

    const key = `token-${matchIndex.toString()}`;

    if (token.startsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else {
      const link = /^\[([^\]]+)\]\(([^\s)]+)\)$/.exec(token);
      const label = link?.[1] ?? token;
      const href = link?.[2] ? getSafeLink(link[2]) : null;

      nodes.push(
        href ? (
          <a href={href} key={key} rel="noreferrer" target="_blank">
            {label}
          </a>
        ) : (
          <Fragment key={key}>{token}</Fragment>
        ),
      );
    }

    cursor = start + token.length;
    matchIndex += 1;
  }

  if (cursor < text.length) {
    nodes.push(<Fragment key="text-after">{text.slice(cursor)}</Fragment>);
  }

  return nodes.length ? nodes : text;
}

function MarkdownHeading({ level, text, children }: MarkdownHeadingProps) {
  const hasCjkTitle = containsCjk(text);

  if (level === 2) {
    return <h4 data-cjk-heading={hasCjkTitle || undefined}>{children}</h4>;
  }

  if (level === 3) {
    return <h5 data-cjk-heading={hasCjkTitle || undefined}>{children}</h5>;
  }

  return <h6 data-cjk-heading={hasCjkTitle || undefined}>{children}</h6>;
}

export function MarkdownArticle({ blocks }: MarkdownArticleProps) {
  return (
    <div className="markdown-article">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index.toString()}`;

        switch (block.type) {
          case "heading":
            return (
              <MarkdownHeading key={key} level={block.level} text={block.text}>
                {renderInline(block.text)}
              </MarkdownHeading>
            );
          case "paragraph":
            return <p key={key}>{renderInline(block.text)}</p>;
          case "list": {
            const items = block.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex.toString()}`}>{renderInline(item)}</li>
            ));

            return block.ordered ? (
              <ol key={key}>{items}</ol>
            ) : (
              <ul key={key}>{items}</ul>
            );
          }
          case "quote":
            return <blockquote key={key}>{renderInline(block.text)}</blockquote>;
          case "code":
            return (
              <pre key={key}>
                <code data-language={block.language}>{block.code}</code>
              </pre>
            );
          case "rule":
            return <hr key={key} />;
        }
      })}
    </div>
  );
}

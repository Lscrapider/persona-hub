import type { RuntimeSectionId } from "@/effects/runtime/archiveRuntimeContract";
import type {
  ArchiveTreeNode,
  LocalizedArchiveContent,
  MarkdownBlock,
} from "@/lib/content/types";

export type PhysicsVocabularyContext = Readonly<{
  surface: RuntimeSectionId;
  target: string;
}>;

export type PhysicsVocabulary = Readonly<{
  resolve: (context: PhysicsVocabularyContext) => readonly string[];
}>;

const MAX_TOKEN_LENGTH = 28;
const MAX_POOL_SIZE = 48;

const SHARED_LANGUAGE = [
  "class",
  "interface",
  "record",
  "static",
  "void",
  "try",
  "catch",
  "def",
  "async",
  "await",
  "yield",
  "with",
  "match",
] as const;

const INDEX_BASE = [
  ...SHARED_LANGUAGE,
  "Java",
  "Python",
  "API",
  "schema",
  "queue",
  "cache",
  "agent",
  "embedding",
  "rank",
  "deploy",
  "service",
  "system",
  "data",
] as const;

const CODE_KEYWORDS = [
  ...SHARED_LANGUAGE,
  "import",
  "from",
  "return",
  "public",
  "private",
  "protected",
  "new",
  "extends",
  "implements",
  "lambda",
  "for",
  "while",
  "if",
  "else",
  "elif",
  "except",
  "finally",
  "raise",
] as const;

function normalizeToken(value: string) {
  const token = value.trim().replace(/\s+/g, " ");

  return token && Array.from(token).length <= MAX_TOKEN_LENGTH ? token : null;
}

function createPool(...sources: readonly (readonly string[])[]) {
  const tokens: string[] = [];
  const seen = new Set<string>();

  for (const source of sources) {
    for (const value of source) {
      const token = normalizeToken(value);

      if (!token) {
        continue;
      }

      const key = token.toLocaleLowerCase("en-US");

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      tokens.push(token);

      if (tokens.length === MAX_POOL_SIZE) {
        return Object.freeze(tokens);
      }
    }
  }

  return Object.freeze(tokens.length ? tokens : [...SHARED_LANGUAGE]);
}

function extractAsciiFragments(...values: readonly string[]) {
  const fragments: string[] = [];

  for (const value of values) {
    const matches = value.match(/[A-Za-z][A-Za-z0-9+#._/-]{1,27}/g);

    if (matches) {
      fragments.push(...matches);
    }
  }

  return fragments;
}

function getCodeVocabulary(block: Extract<MarkdownBlock, { type: "code" }>) {
  const presentKeywords: string[] = [];

  for (const keyword of CODE_KEYWORDS) {
    const expression = new RegExp(`\\b${keyword}\\b`, "i");

    if (expression.test(block.code)) {
      presentKeywords.push(keyword);
    }
  }

  return createPool(
    [block.language],
    presentKeywords,
    extractAsciiFragments(block.language),
    SHARED_LANGUAGE,
  );
}

function indexTreeNodes(
  index: Map<string, readonly string[]>,
  nodes: readonly ArchiveTreeNode[],
  runtimePath: string,
  projectPool: readonly string[],
) {
  for (const node of nodes) {
    const nodePath = `${runtimePath}/${node.name}`;
    const nodePool = createPool(
      [node.name],
      node.detail ? [node.detail] : [],
      projectPool,
    );

    index.set(nodePath, nodePool);

    if (node.children?.length) {
      indexTreeNodes(index, node.children, nodePath, nodePool);
    }
  }
}

function normalizePath(value: string) {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

export function createPhysicsVocabulary(
  content: LocalizedArchiveContent,
): PhysicsVocabulary {
  const index = new Map<string, readonly string[]>();
  const sharedPool = createPool(INDEX_BASE);
  const indexPool = createPool(
    [content.site.name, content.site.signature],
    INDEX_BASE,
  );
  const timelineBase = createPool(
    [content.site.sections.timeline.title, "timeline", "milestone", "resolve"],
    SHARED_LANGUAGE,
  );
  const projectsBase = createPool(
    [content.site.sections.projects.title, "projects", "build", "mount"],
    INDEX_BASE,
  );
  const logsBase = createPool(
    [content.site.sections.logs.title, "logs", "trace", "inspect"],
    SHARED_LANGUAGE,
  );

  index.set("index", indexPool);
  index.set("timeline", timelineBase);
  index.set("projects", projectsBase);
  index.set("logs", logsBase);

  for (const record of content.archive.timeline) {
    index.set(
      `timeline/${record.id}`,
      createPool(
        [record.kind],
        extractAsciiFragments(record.kind, record.title),
        timelineBase,
      ),
    );
  }

  for (const project of content.archive.projects) {
    const projectPath = `projects/${project.id}`;
    const projectPool = createPool(
      project.stack,
      project.capabilities,
      extractAsciiFragments(project.title),
      projectsBase,
    );

    index.set(projectPath, projectPool);
    index.set(`${projectPath}/root`, projectPool);
    indexTreeNodes(index, project.tree, `${projectPath}/root`, projectPool);
  }

  for (const log of content.archive.logs) {
    const logPath = `logs/${log.id}`;
    const codePools: string[] = [];

    log.blocks.forEach((block, blockIndex) => {
      const blockPath = `${logPath}/block-${(blockIndex + 1)
        .toString()
        .padStart(2, "0")}`;

      if (block.type === "code") {
        const codePool = getCodeVocabulary(block);
        index.set(blockPath, createPool(codePool, log.tags, logsBase));
        codePools.push(...codePool);
        return;
      }

      const text =
        block.type === "list"
          ? block.items.join(" ")
          : block.type === "rule"
            ? ""
            : block.text;

      index.set(
        blockPath,
        createPool(extractAsciiFragments(text), log.tags, logsBase),
      );
    });

    index.set(
      logPath,
      createPool(log.tags, codePools, extractAsciiFragments(log.title), logsBase),
    );
  }

  return Object.freeze({
    resolve({ surface, target }: PhysicsVocabularyContext) {
      let path = normalizePath(target);

      while (path) {
        const exact = index.get(path);

        if (exact?.length) {
          return exact;
        }

        const separator = path.lastIndexOf("/");
        path = separator >= 0 ? path.slice(0, separator) : "";
      }

      return index.get(surface) ?? sharedPool;
    },
  });
}

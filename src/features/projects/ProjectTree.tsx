import type { CSSProperties } from "react";

import type { ProjectDocument } from "@/lib/content/types";

type ProjectTreeProps = Readonly<{
  activePath: string;
  documents: readonly ProjectDocument[];
  onOpenDocument: (path: string) => void;
  projectId: string;
}>;

type FileTreeNode = Readonly<{
  kind: "file";
  name: string;
  path: string;
}>;

type FolderTreeNode = Readonly<{
  children: readonly TreeNode[];
  kind: "folder";
  name: string;
  path: string;
}>;

type TreeNode = FileTreeNode | FolderTreeNode;

type MutableFolder = {
  children: MutableTreeNode[];
  kind: "folder";
  name: string;
  path: string;
};

type MutableTreeNode = FileTreeNode | MutableFolder;

function buildFileTree(documents: readonly ProjectDocument[]): readonly TreeNode[] {
  const root: MutableFolder = {
    children: [],
    kind: "folder",
    name: "root",
    path: "",
  };

  documents.forEach((document) => {
    const segments = document.path.split("/");
    const fileName = segments.pop();

    if (!fileName) {
      return;
    }

    let folder = root;

    segments.forEach((segment) => {
      const existing = folder.children.find(
        (node): node is MutableFolder =>
          node.kind === "folder" && node.name === segment,
      );

      if (existing) {
        folder = existing;
        return;
      }

      const nextPath = folder.path ? `${folder.path}/${segment}` : segment;
      const nextFolder: MutableFolder = {
        children: [],
        kind: "folder",
        name: segment,
        path: nextPath,
      };
      folder.children.push(nextFolder);
      folder = nextFolder;
    });

    folder.children.push({
      kind: "file",
      name: fileName,
      path: document.path,
    });
  });

  return root.children;
}

export function ProjectTree({
  activePath,
  documents,
  onOpenDocument,
  projectId,
}: ProjectTreeProps) {
  return (
    <TreeItems
      activePath={activePath}
      nodes={buildFileTree(documents)}
      onOpenDocument={onOpenDocument}
      projectId={projectId}
    />
  );
}

type TreeItemsProps = Readonly<{
  activePath: string;
  nodes: readonly TreeNode[];
  onOpenDocument: (path: string) => void;
  projectId: string;
}>;

function TreeItems({
  activePath,
  nodes,
  onOpenDocument,
  projectId,
}: TreeItemsProps) {
  return (
    <ul className="project-tree">
      {nodes.map((node, index) => {
        const itemStyle = {
          "--project-tree-index": index,
        } as CSSProperties;

        if (node.kind === "folder") {
          return (
            <li key={node.path} style={itemStyle}>
              <details open>
                <summary
                  data-runtime-activate-action="toggle"
                  data-runtime-hover-action="inspect"
                  data-runtime-target={`projects/${projectId}/folder/${node.path}`}
                >
                  <span aria-hidden="true" className="project-tree__toggle" />
                  <span className="project-tree__name">{node.name}</span>
                </summary>
                <TreeItems
                  activePath={activePath}
                  nodes={node.children}
                  onOpenDocument={onOpenDocument}
                  projectId={projectId}
                />
              </details>
            </li>
          );
        }

        const isActive = node.path === activePath;

        return (
          <li key={node.path} style={itemStyle}>
            <button
              aria-controls="project-document"
              aria-pressed={isActive}
              className="project-tree__file"
              data-document-path={node.path}
              data-runtime-activate-action="select"
              data-runtime-hover-action="inspect"
              data-runtime-target={`projects/${projectId}/document/${node.path}`}
              data-selected={isActive || undefined}
              data-webgl-anchor="project-node"
              onClick={() => onOpenDocument(node.path)}
              type="button"
            >
              <span aria-hidden="true" className="project-tree__file-mark" />
              <span className="project-tree__name">{node.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

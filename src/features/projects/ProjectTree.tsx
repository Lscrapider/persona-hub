import type { ArchiveTreeNode } from "@/lib/content/types";

type ProjectTreeProps = Readonly<{
  nodes: readonly ArchiveTreeNode[];
}>;

type ProjectTreeItemsProps = Readonly<{
  nodes: readonly ArchiveTreeNode[];
  path: string;
}>;

export function ProjectTree({ nodes }: ProjectTreeProps) {
  return <ProjectTreeItems nodes={nodes} path="root" />;
}

function ProjectTreeItems({ nodes, path }: ProjectTreeItemsProps) {
  return (
    <ul className="project-tree">
      {nodes.map((node, index) => {
        const nodePath = `${path}-${index.toString()}-${node.name}`;
        const hasChildren = Boolean(node.children?.length);

        return (
          <li key={nodePath}>
            {hasChildren ? (
              <details open>
                <summary>
                  <span aria-hidden="true" className="project-tree__toggle" />
                  <span className="project-tree__name">{node.name}</span>
                </summary>
                {node.detail ? (
                  <small className="project-tree__detail">{node.detail}</small>
                ) : null}
                <ProjectTreeItems nodes={node.children ?? []} path={nodePath} />
              </details>
            ) : (
              <>
                <span className="project-tree__leaf">{node.name}</span>
                {node.detail ? (
                  <small className="project-tree__detail">{node.detail}</small>
                ) : null}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

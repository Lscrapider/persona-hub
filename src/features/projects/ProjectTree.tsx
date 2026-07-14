import type { ArchiveTreeNode } from "@/lib/content/types";

type ProjectTreeProps = Readonly<{
  nodes: readonly ArchiveTreeNode[];
  projectId: string;
}>;

type ProjectTreeItemsProps = Readonly<{
  nodes: readonly ArchiveTreeNode[];
  reactPath: string;
  runtimePath: string;
}>;

export function ProjectTree({ nodes, projectId }: ProjectTreeProps) {
  return (
    <ProjectTreeItems
      nodes={nodes}
      reactPath="root"
      runtimePath={`projects/${projectId}/root`}
    />
  );
}

function ProjectTreeItems({
  nodes,
  reactPath,
  runtimePath,
}: ProjectTreeItemsProps) {
  return (
    <ul className="project-tree">
      {nodes.map((node, index) => {
        const reactNodePath = `${reactPath}-${index.toString()}-${node.name}`;
        const runtimeNodePath = `${runtimePath}/${node.name}`;
        const hasChildren = Boolean(node.children?.length);

        return (
          <li key={reactNodePath}>
            {hasChildren ? (
              <details open>
                <summary
                  data-runtime-activate-action="toggle"
                  data-runtime-hover-action="inspect"
                  data-runtime-target={runtimeNodePath}
                >
                  <span aria-hidden="true" className="project-tree__toggle" />
                  <span className="project-tree__name">{node.name}</span>
                </summary>
                {node.detail ? (
                  <small className="project-tree__detail">{node.detail}</small>
                ) : null}
                <ProjectTreeItems
                  nodes={node.children ?? []}
                  reactPath={reactNodePath}
                  runtimePath={runtimeNodePath}
                />
              </details>
            ) : (
              <>
                <span
                  className="project-tree__leaf"
                  data-runtime-hover-action="inspect"
                  data-runtime-target={runtimeNodePath}
                >
                  {node.name}
                </span>
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

import { CopyReveal } from "@/effects/primitives/CopyReveal";
import { containsCjk } from "@/lib/typography";

type CurrentIndexItem = Readonly<{
  id: string;
  title: string;
  meta: string;
  href: string;
}>;

type CurrentIndexProps = Readonly<{
  heading: string;
  items: readonly CurrentIndexItem[];
  onSelectProject: (projectId: string) => void;
  revealEnabled: boolean;
}>;

export function CurrentIndex({
  heading,
  items,
  onSelectProject,
  revealEnabled,
}: CurrentIndexProps) {
  return (
    <section className="current-index" aria-labelledby="current-index-title">
      <div className="current-index__heading">
        <h2 id="current-index-title">
          <CopyReveal enabled={revealEnabled} text={heading} />
        </h2>
      </div>

      <ol className="current-index__list">
        {items.map((item) => (
          <li className="current-index__item" key={item.id}>
            <a
              className="current-index__link"
              data-runtime-activate-action="select"
              data-runtime-hover-action="inspect"
              data-runtime-target={`projects/${item.id}`}
              href={item.href}
              onClick={(event) => {
                if (
                  event.button !== 0 ||
                  event.metaKey ||
                  event.altKey ||
                  event.ctrlKey ||
                  event.shiftKey
                ) {
                  return;
                }

                event.preventDefault();
                onSelectProject(item.id);
              }}
            >
              <span className="current-index__number">
                <CopyReveal enabled={revealEnabled} text={item.id} />
              </span>
              <span aria-hidden="true" className="current-index__locator" />
              <span
                className="current-index__title"
                data-cjk-heading={containsCjk(item.title) || undefined}
              >
                <CopyReveal
                  className="current-index__title-copy"
                  enabled={revealEnabled}
                  text={item.title}
                />
              </span>
              <span className="current-index__meta">
                <CopyReveal
                  className="current-index__summary-copy"
                  enabled={revealEnabled}
                  text={item.meta}
                />
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

import type { IndexItem } from "@/content/site";
import { CopyReveal } from "@/effects/primitives/CopyReveal";

type CurrentIndexProps = Readonly<{
  items: readonly IndexItem[];
  revealEnabled: boolean;
}>;

export function CurrentIndex({ items, revealEnabled }: CurrentIndexProps) {
  return (
    <section className="current-index" aria-labelledby="current-index-title">
      <div className="current-index__heading">
        <h2 id="current-index-title">
          <CopyReveal enabled={revealEnabled} text="Current index" />
        </h2>
      </div>

      <ol className="current-index__list">
        {items.map((item) => (
          <li className="current-index__item" key={item.id}>
            <a className="current-index__link" href={item.href}>
              <span className="current-index__number">
                <CopyReveal enabled={revealEnabled} text={item.id} />
              </span>
              <span aria-hidden="true" className="current-index__locator" />
              <span className="current-index__title">
                <CopyReveal enabled={revealEnabled} text={item.title} />
              </span>
              <span className="current-index__meta">
                <CopyReveal enabled={revealEnabled} text={item.meta} />
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}

import Link from "next/link";

import type { IndexItem } from "@/content/site";

type CurrentIndexProps = Readonly<{
  items: readonly IndexItem[];
}>;

export function CurrentIndex({ items }: CurrentIndexProps) {
  return (
    <section className="current-index" aria-labelledby="current-index-title">
      <div className="current-index__heading">
        <h2 id="current-index-title">Current index</h2>
        <span aria-hidden="true" className="current-index__heading-rule" />
      </div>

      <ol className="current-index__list">
        {items.map((item) => (
          <li className="current-index__item" key={item.id}>
            <Link className="current-index__link" href={item.href}>
              <span aria-hidden="true" className="current-index__number">
                {item.id}
              </span>
              <span aria-hidden="true" className="current-index__locator" />
              <span className="current-index__title">{item.title}</span>
              <span className="current-index__meta">{item.meta}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

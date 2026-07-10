import Link from "next/link";

type ModuleReservedProps = Readonly<{
  moduleName: string;
  summary: string;
  nextStep: string;
}>;

export function ModuleReserved({
  moduleName,
  summary,
  nextStep,
}: ModuleReservedProps) {
  return (
    <main className="module-reserved">
      <section
        aria-labelledby="module-reserved-title"
        className="module-reserved__content"
      >
        <p className="module-reserved__status">
          <span aria-hidden="true" />
          Module reserved
        </p>
        <h1 id="module-reserved-title">{moduleName}</h1>
        <p className="module-reserved__summary">{summary}</p>
        <p className="module-reserved__next-step">{nextStep}</p>
        <Link className="module-reserved__home-link" href="/">
          <span aria-hidden="true">←</span>
          Return to Home
        </Link>
      </section>
    </main>
  );
}

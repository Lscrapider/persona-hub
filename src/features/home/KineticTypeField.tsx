type KineticTypeFieldProps = Readonly<{
  active: boolean;
}>;

export function KineticTypeField({ active }: KineticTypeFieldProps) {
  return (
    <div
      aria-hidden="true"
      className="kinetic-field"
      data-active={active || undefined}
      data-physics-surface={active ? "index" : undefined}
      data-physics-target={active ? "index" : undefined}
    />
  );
}

export function KineticTypeFieldFallback() {
  return (
    <div
      aria-hidden="true"
      className="kinetic-field kinetic-field--unavailable"
    />
  );
}

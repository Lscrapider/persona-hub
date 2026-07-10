"use client";

import { Component, type ReactNode } from "react";

type EffectBoundaryProps = Readonly<{
  children: ReactNode;
  fallback?: ReactNode;
}>;

type EffectBoundaryState = {
  failed: boolean;
};

export class EffectBoundary extends Component<
  EffectBoundaryProps,
  EffectBoundaryState
> {
  state: EffectBoundaryState = { failed: false };

  static getDerivedStateFromError(): EffectBoundaryState {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return this.props.fallback ?? null;
    }

    return this.props.children;
  }
}

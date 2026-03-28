import { Component, type ErrorInfo, type ReactNode } from 'react';

import { EmptyState } from '@/components/common/EmptyState';

interface BountyBoardErrorBoundaryProps {
  children: ReactNode;
}

interface BountyBoardErrorBoundaryState {
  hasError: boolean;
}

export class BountyBoardErrorBoundary extends Component<
  BountyBoardErrorBoundaryProps,
  BountyBoardErrorBoundaryState
> {
  state: BountyBoardErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): BountyBoardErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[bounty-board] render error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <EmptyState
          title="Bounty board render failed"
          description="A UI error interrupted this page. Refresh the page and verify the current data mode or browser console logs. The route stays mounted instead of dropping to a blank shell."
        />
      );
    }

    return this.props.children;
  }
}

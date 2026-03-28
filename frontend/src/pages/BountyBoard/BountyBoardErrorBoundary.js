import { jsx as _jsx } from "react/jsx-runtime";
import { Component } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
export class BountyBoardErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            hasError: false,
        };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, errorInfo) {
        console.error('[bounty-board] render error', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (_jsx(EmptyState, { title: "Bounty board render failed", description: "A UI error interrupted this page. Refresh the page and verify the current data mode or browser console logs. The route stays mounted instead of dropping to a blank shell." }));
        }
        return this.props.children;
    }
}

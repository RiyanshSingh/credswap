import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                        <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                        Something went wrong
                    </h2>
                    <p className="text-muted-foreground max-w-md mb-8">
                        We encountered an unexpected error. Please try refreshing the page.
                    </p>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Page
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => this.setState({ hasError: false })}
                        >
                            Try Again
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

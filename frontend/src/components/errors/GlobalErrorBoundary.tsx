// src/components/errors/GlobalErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FaExclamationTriangle, FaRedo, FaHome } from 'react-icons/fa';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Uncaught error:', error, errorInfo);

        this.setState({
            error,
            errorInfo,
        });
    }

    private handleReload = (): void => {
        window.location.reload();
    };

    private handleGoHome = (): void => {
        window.location.href = '/';
    };

    public render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div
                    role="alert"
                    aria-live="assertive"
                    className="min-h-screen flex items-center justify-center bg-gray-900"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100vh',
                        padding: '20px',
                        backgroundColor: '#0f172a',
                        color: '#f1f5f9',
                    }}
                >
                    <div
                        className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center"
                        style={{
                            maxWidth: '600px',
                            width: '100%',
                            backgroundColor: '#1e293b',
                            borderRadius: '12px',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                            padding: '40px',
                            textAlign: 'center',
                        }}
                    >
                        <FaExclamationTriangle
                            style={{
                                fontSize: '64px',
                                color: '#f59e0b',
                                marginBottom: '24px',
                            }}
                            aria-hidden="true"
                        />

                        <h1
                            style={{
                                fontSize: '28px',
                                fontWeight: 600,
                                marginBottom: '16px',
                                color: '#f8fafc',
                            }}
                        >
                            Something went wrong
                        </h1>

                        <p
                            style={{
                                fontSize: '16px',
                                color: '#94a3b8',
                                marginBottom: '24px',
                                lineHeight: 1.6,
                            }}
                        >
                            We encountered an unexpected error. This might be
                            due to a WebGL context issue, loading problematic
                            data, or a temporary network problem.
                        </p>

                        {this.state.error && (
                            <div
                                style={{
                                    backgroundColor: '#0f172a',
                                    borderRadius: '8px',
                                    padding: '16px',
                                    marginBottom: '24px',
                                    textAlign: 'left',
                                    overflow: 'auto',
                                    maxHeight: '200px',
                                }}
                            >
                                <p
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        marginBottom: '8px',
                                        color: '#cbd5e1',
                                    }}
                                >
                                    Error Details:
                                </p>
                                <p
                                    style={{
                                        fontSize: '13px',
                                        color: '#ef4444',
                                        fontFamily: 'monospace',
                                        margin: 0,
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'center',
                                flexWrap: 'wrap',
                            }}
                        >
                            <button
                                onClick={this.handleReload}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center gap-2"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease',
                                }}
                                aria-label="Reload the map"
                            >
                                <FaRedo aria-hidden="true" />
                                Reload Map
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="bg-transparent hover:bg-gray-700 text-blue-400 font-bold py-2 px-4 rounded border border-blue-400"
                                style={{
                                    padding: '12px 24px',
                                    fontSize: '16px',
                                    fontWeight: 500,
                                    backgroundColor: 'transparent',
                                    color: '#3b82f6',
                                    border: '2px solid #3b82f6',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                aria-label="Go to home page"
                            >
                                <FaHome
                                    aria-hidden="true"
                                    style={{ marginRight: '8px' }}
                                />
                                Go to Home
                            </button>
                        </div>

                        <p
                            style={{
                                marginTop: '24px',
                                fontSize: '14px',
                                color: '#64748b',
                            }}
                        >
                            If the problem persists, please contact support.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Export a hook-based version for functional components
export function useErrorBoundary() {
    const [error, setError] = React.useState<Error | null>(null);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return { error, resetError, setError };
}

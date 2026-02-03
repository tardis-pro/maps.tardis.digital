// src/components/errors/MapErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { FiRefreshCw, FiMap } from 'react-icons/fi';

interface Props {
    children: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: string | null;
}

/**
 * MapErrorBoundary - Specialized error boundary for map components
 *
 * Catches WebGL context loss, bad data errors, and other map-related crashes
 * while allowing the rest of the application to function normally.
 */
export class MapErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error for debugging
        console.error('[MapErrorBoundary] Map component crashed:', error);
        console.error('[MapErrorBoundary] Component stack:', errorInfo.componentStack);

        this.setState({
            error,
            errorInfo: errorInfo.componentStack,
        });
    }

    private handleReset = () => {
        // Reset local state
        this.setState({ hasError: false, error: null, errorInfo: null });

        // Call optional onReset callback for additional cleanup
        this.props.onReset?.();

        // Attempt to reload the map by triggering a re-render
        // The parent component should handle actual map re-initialization
    };

    private handleReloadMap = () => {
        // Full page reload for critical map errors
        if (typeof window !== 'undefined') {
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div
                    className="map-error-boundary"
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        minHeight: '400px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                    }}
                    role="alert"
                    aria-live="polite"
                >
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '24px',
                            maxWidth: '400px',
                        }}
                    >
                        {/* Error Icon */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginBottom: '16px',
                            }}
                        >
                            <div
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '50%',
                                    backgroundColor: '#7f1d1d',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <FiMap
                                    size={32}
                                    color="#fca5a5"
                                />
                            </div>
                        </div>

                        {/* Error Title */}
                        <h2
                            style={{
                                color: '#fca5a5',
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                marginBottom: '8px',
                                margin: 0,
                            }}
                        >
                            Map Error
                        </h2>

                        {/* Error Message */}
                        <p
                            style={{
                                color: '#94a3b8',
                                fontSize: '0.875rem',
                                marginBottom: '16px',
                                margin: 0,
                            }}
                        >
                            {this.state.error?.message ||
                                'The map encountered an error and could not load.'}
                        </p>

                        {/* Error Details (collapsed by default) */}
                        {this.state.errorInfo && process.env.NODE_ENV === 'development' && (
                            <details
                                style={{
                                    marginBottom: '16px',
                                    textAlign: 'left',
                                    backgroundColor: '#1e293b',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                }}
                            >
                                <summary
                                    style={{
                                        cursor: 'pointer',
                                        color: '#94a3b8',
                                        marginBottom: '8px',
                                    }}
                                >
                                    Error Details
                                </summary>
                                <pre
                                    style={{
                                        margin: 0,
                                        overflow: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {this.state.errorInfo}
                                </pre>
                            </details>
                        )}

                        {/* Action Buttons */}
                        <div
                            style={{
                                display: 'flex',
                                gap: '12px',
                                justifyContent: 'center',
                            }}
                        >
                            <button
                                onClick={this.handleReset}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#2563eb';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = '#3b82f6';
                                }}
                            >
                                <FiRefreshCw size={16} />
                                Retry
                            </button>
                            <button
                                onClick={this.handleReloadMap}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '10px 20px',
                                    backgroundColor: '#475569',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#64748b';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = '#475569';
                                }}
                            >
                                Reload Map
                            </button>
                        </div>

                        {/* Help Text */}
                        <p
                            style={{
                                color: '#64748b',
                                fontSize: '0.75rem',
                                marginTop: '16px',
                                margin: '16px 0 0 0',
                            }}
                        >
                            If the problem persists, try clearing your browser cache or
                            refreshing the page.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default MapErrorBoundary;

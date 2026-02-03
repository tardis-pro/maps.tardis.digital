// src/components/errors/AnalysisErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { FiRefreshCw, FiBarChart2 } from 'react-icons/fi';

interface Props {
    children: ReactNode;
    panelName?: string;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: string | null;
}

/**
 * AnalysisErrorBoundary - Specialized error boundary for analysis/analytics components
 *
 * Catches errors in spatial analysis, data processing, and visualization components
 * while allowing the rest of the application to function normally.
 */
export class AnalysisErrorBoundary extends Component<Props, State> {
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
        console.error('[AnalysisErrorBoundary] Analysis component crashed:', error);
        console.error('[AnalysisErrorBoundary] Component stack:', errorInfo.componentStack);

        this.setState({
            error,
            errorInfo: errorInfo.componentStack,
        });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        this.props.onReset?.();
    };

    render() {
        if (this.state.hasError) {
            const panelName = this.props.panelName || 'Analysis Panel';

            return (
                <div
                    className="analysis-error-boundary"
                    style={{
                        padding: '24px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        minHeight: '300px',
                    }}
                    role="alert"
                    aria-live="polite"
                >
                    <div
                        style={{
                            textAlign: 'center',
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
                                    backgroundColor: '#7c2d12',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <FiBarChart2
                                    size={32}
                                    color="#fdba74"
                                />
                            </div>
                        </div>

                        {/* Error Title */}
                        <h2
                            style={{
                                color: '#fdba74',
                                fontSize: '1.25rem',
                                fontWeight: 600,
                                marginBottom: '8px',
                                margin: 0,
                            }}
                        >
                            {panelName} Error
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
                                'The analysis encountered an error and could not complete.'}
                        </p>

                        {/* Error Details (development only) */}
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
                            Try selecting different datasets or analysis parameters.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default AnalysisErrorBoundary;

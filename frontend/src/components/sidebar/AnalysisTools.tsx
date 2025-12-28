import React from 'react';
import { FaDrawPolygon, FaRuler, FaObjectGroup } from 'react-icons/fa';

interface AnalysisTool {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
}

const tools: AnalysisTool[] = [
    {
        id: 'buffer',
        name: 'Buffer',
        icon: <FaDrawPolygon />,
        description: 'Create buffer zones',
    },
    {
        id: 'intersect',
        name: 'Intersect',
        icon: <FaObjectGroup />,
        description: 'Find overlaps',
    },
    {
        id: 'measure',
        name: 'Measure',
        icon: <FaRuler />,
        description: 'Measure distances',
    },
];

interface AnalysisToolsProps {
    onToolSelect: (toolId: string) => void;
}

const AnalysisTools: React.FC<AnalysisToolsProps> = ({ onToolSelect }) => {
    return (
        <div style={{ padding: 'var(--spacing-md)' }}>
            {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => onToolSelect(tool.id)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-md)',
                        width: '100%',
                        padding: 'var(--spacing-md)',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        marginBottom: 'var(--spacing-sm)',
                        textAlign: 'left',
                    }}
                    className="hover:bg-gray-50"
                >
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                        {tool.icon}
                    </span>
                    <div>
                        <div
                            style={{
                                fontSize: '14px',
                                color: 'var(--color-text-primary)',
                                fontWeight: 500,
                            }}
                        >
                            {tool.name}
                        </div>
                        <div
                            style={{
                                fontSize: '12px',
                                color: 'var(--color-text-muted)',
                            }}
                        >
                            {tool.description}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default AnalysisTools;

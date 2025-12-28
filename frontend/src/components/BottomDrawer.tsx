import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';

interface Column {
    key: string;
    label: string;
    width?: string;
}

interface BottomDrawerProps {
    isExpanded: boolean;
    onToggle: () => void;
    title: string;
    subtitle?: string;
    columns: Column[];
    data: Record<string, any>[];
    featureCount: number;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

const BottomDrawer: React.FC<BottomDrawerProps> = ({
    isExpanded,
    onToggle,
    title,
    subtitle,
    columns,
    data,
    featureCount,
    currentPage,
    totalPages,
    onPageChange,
}) => {
    return (
        <motion.div
            initial={false}
            animate={{
                height: isExpanded
                    ? 'var(--drawer-expanded)'
                    : 'var(--drawer-collapsed)',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'var(--color-bg-primary)',
                borderTop: '1px solid var(--color-border)',
                boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
                zIndex: 40,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            {/* Header - always visible */}
            <div
                onClick={onToggle}
                style={{
                    height: 'var(--drawer-collapsed)',
                    minHeight: 'var(--drawer-collapsed)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 var(--spacing-lg)',
                    cursor: 'pointer',
                    borderBottom: isExpanded
                        ? '1px solid var(--color-border)'
                        : 'none',
                }}
                className="hover:bg-gray-50"
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-lg)',
                    }}
                >
                    {isExpanded ? (
                        <FaChevronDown
                            size={12}
                            style={{ color: 'var(--color-text-muted)' }}
                        />
                    ) : (
                        <FaChevronUp
                            size={12}
                            style={{ color: 'var(--color-text-muted)' }}
                        />
                    )}
                    <span
                        style={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                        }}
                    >
                        {title} ({featureCount.toLocaleString()})
                    </span>
                    {subtitle && (
                        <span
                            style={{
                                fontSize: '13px',
                                color: 'var(--color-text-muted)',
                            }}
                        >
                            {subtitle}
                        </span>
                    )}
                </div>
                <span
                    style={{
                        fontSize: '12px',
                        color: 'var(--color-text-muted)',
                    }}
                >
                    {isExpanded ? 'Click to minimize' : 'Click to expand'}
                </span>
            </div>

            {/* Table content - only when expanded */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Table */}
                        <div style={{ flex: 1, overflow: 'auto' }}>
                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '13px',
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor:
                                                'var(--color-bg-secondary)',
                                        }}
                                    >
                                        {columns.map((col) => (
                                            <th
                                                key={col.key}
                                                style={{
                                                    padding:
                                                        'var(--spacing-sm) var(--spacing-md)',
                                                    textAlign: 'left',
                                                    fontWeight: 600,
                                                    color: 'var(--color-text-secondary)',
                                                    borderBottom:
                                                        '1px solid var(--color-border)',
                                                    whiteSpace: 'nowrap',
                                                    width: col.width,
                                                }}
                                            >
                                                {col.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row, idx) => (
                                        <tr
                                            key={idx}
                                            style={{
                                                backgroundColor:
                                                    idx % 2 === 0
                                                        ? 'transparent'
                                                        : 'var(--color-bg-secondary)',
                                            }}
                                            className="hover:bg-blue-50"
                                        >
                                            {columns.map((col) => (
                                                <td
                                                    key={col.key}
                                                    style={{
                                                        padding:
                                                            'var(--spacing-sm) var(--spacing-md)',
                                                        color: 'var(--color-text-primary)',
                                                        borderBottom:
                                                            '1px solid var(--color-border-light)',
                                                    }}
                                                >
                                                    {row[col.key] ?? '-'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {data.length === 0 && (
                                <div
                                    style={{
                                        padding: 'var(--spacing-xl)',
                                        textAlign: 'center',
                                        color: 'var(--color-text-muted)',
                                    }}
                                >
                                    No data to display. Select a layer to view
                                    its features.
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding:
                                        'var(--spacing-sm) var(--spacing-lg)',
                                    borderTop: '1px solid var(--color-border)',
                                    fontSize: '12px',
                                    color: 'var(--color-text-secondary)',
                                }}
                            >
                                <span>
                                    Showing {(currentPage - 1) * 50 + 1}-
                                    {Math.min(currentPage * 50, featureCount)}{' '}
                                    of {featureCount.toLocaleString()}
                                </span>
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 'var(--spacing-xs)',
                                    }}
                                >
                                    <button
                                        onClick={() =>
                                            onPageChange(currentPage - 1)
                                        }
                                        disabled={currentPage === 1}
                                        style={{
                                            padding:
                                                'var(--spacing-xs) var(--spacing-sm)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'transparent',
                                            cursor:
                                                currentPage === 1
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                            opacity:
                                                currentPage === 1 ? 0.5 : 1,
                                        }}
                                    >
                                        Prev
                                    </button>
                                    <span
                                        style={{
                                            padding:
                                                'var(--spacing-xs) var(--spacing-sm)',
                                        }}
                                    >
                                        {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() =>
                                            onPageChange(currentPage + 1)
                                        }
                                        disabled={currentPage === totalPages}
                                        style={{
                                            padding:
                                                'var(--spacing-xs) var(--spacing-sm)',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 'var(--radius-sm)',
                                            backgroundColor: 'transparent',
                                            cursor:
                                                currentPage === totalPages
                                                    ? 'not-allowed'
                                                    : 'pointer',
                                            opacity:
                                                currentPage === totalPages
                                                    ? 0.5
                                                    : 1,
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default BottomDrawer;

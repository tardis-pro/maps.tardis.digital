import React from 'react';

const LoadingIndicator: React.FC = () => {
    return (
        <div
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 1000,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                padding: '15px 30px',
                borderRadius: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}
        >
            <div
                style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '3px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                }}
            />
            <span>Processing...</span>
            <style>
                {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
};

export default LoadingIndicator;

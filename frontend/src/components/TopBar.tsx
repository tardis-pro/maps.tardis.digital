import React from 'react';
import { FaBars, FaCog, FaQuestionCircle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

interface TopBarProps {
  onMenuClick: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--color-bg-primary)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--spacing-lg)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <button
          onClick={onMenuClick}
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--spacing-sm)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-secondary)',
          }}
          className="hover:bg-gray-100"
          aria-label="Toggle sidebar"
        >
          <FaBars size={18} />
        </button>
        <span
          style={{
            fontWeight: 600,
            fontSize: '16px',
            color: 'var(--color-text-primary)',
          }}
        >
          Tardis Maps
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--spacing-sm)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-secondary)',
          }}
          className="hover:bg-gray-100"
          aria-label="Help"
        >
          <FaQuestionCircle size={16} />
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            padding: 'var(--spacing-sm)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text-secondary)',
          }}
          className="hover:bg-gray-100"
          aria-label="Settings"
        >
          <FaCog size={16} />
        </button>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px',
            fontWeight: 600,
            marginLeft: 'var(--spacing-sm)',
            cursor: 'pointer',
          }}
        >
          {user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : 'G'}
        </div>
      </div>
    </header>
  );
};

export default TopBar;

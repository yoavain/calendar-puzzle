import React from 'react';
import { useColorMode } from '../theme';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { mode, toggleColorMode } = useColorMode();
  const isDark = mode === 'dark';

  return (
    <div className={`theme-toggle ${className || ''}`}>
      <label className="switch">
        <input
          type="checkbox"
          checked={isDark}
          onChange={toggleColorMode}
        />
        <span className="slider">
          <span className="icon">🌞</span>
          <span className="icon">🌙</span>
        </span>
      </label>
    </div>
  );
};

export default ThemeToggle;

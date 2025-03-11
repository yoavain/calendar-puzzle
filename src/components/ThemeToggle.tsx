import React, { useEffect, useState } from 'react';

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Initialize theme from localStorage or default to dark
    const savedTheme = localStorage.getItem('theme');
    setIsDark(savedTheme !== 'light');
  }, []);

  useEffect(() => {
    // Update data-theme attribute and localStorage when theme changes
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div className={`theme-toggle ${className || ''}`}>
      <label className="switch">
        <input
          type="checkbox"
          checked={isDark}
          onChange={(e) => setIsDark(e.target.checked)}
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

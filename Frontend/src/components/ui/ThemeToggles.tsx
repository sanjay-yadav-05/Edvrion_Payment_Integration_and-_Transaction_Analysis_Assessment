// src/components/ThemeToggle.js
import React from 'react';
import { useTheme } from '@/context/ThemeProvider';
import { Button } from 'react-day-picker'; // Assuming a Shadcn/UI or similar button

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button onClick={toggleTheme} variant="outline" size="icon">
      {theme === 'light' ? '🌙' : '☀️'}
    </Button>
  );
};

export default ThemeToggle;
// src/components/ModernButton.tsx
// Modern, animated button component

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ModernButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const ModernButton = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
}: ModernButtonProps) => {
  const baseClass = `modern-button modern-button--${variant} modern-button--${size}`;
  const className = fullWidth ? `${baseClass} w-full` : baseClass;

  return (
    <motion.button
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="inline-block animate-spin">⟳</span>
          Loading...
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
};

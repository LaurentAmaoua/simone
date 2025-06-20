import type { CSSProperties, ReactNode } from "react";

import styles from "./styles/Button.module.css";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button = ({
  children,
  className,
  style,
  onClick,
  disabled = false,
}: ButtonProps) => {
  return (
    <button
      className={`${styles.container} ${className ?? ""}`}
      style={style}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

import type { CSSProperties, ReactNode } from "react";

import styles from "./styles/Button.module.css";

interface ButtonProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const Button = ({ children, className, style }: ButtonProps) => {
  return (
    <button className={`${styles.container} ${className ?? ""}`} style={style}>
      {children}
    </button>
  );
};

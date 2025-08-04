import { SimoneHead } from "~/assets/SimoneHead";
import styles from "./styles/Header.module.css";

export const Header = ({ onTitleClick }: { onTitleClick: () => void }) => {
  return (
    <header className={styles.container}>
      <div className={styles.inner}>
        <button onClick={onTitleClick}>
          <h1 className={styles.title}>Simone</h1>
        </button>
        <SimoneHead />
      </div>
    </header>
  );
};

import { SimoneHead } from "~/assets/SimoneHead";
import styles from "./styles/Header.module.css";

export const Header = () => {
  return (
    <header className={styles.container}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Simone</h1>
        <SimoneHead />
      </div>
    </header>
  );
};

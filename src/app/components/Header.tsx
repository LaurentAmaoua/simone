import styles from "./styles/Header.module.css";

export const Header = () => {
  return (
    <header className={styles.container}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Simone</h1>
        <h2>
          par{" "}
          <a
            className={styles.link}
            href="https://www.eden-villages.fr/"
            target="_blank"
          >
            Eden Villages
          </a>
        </h2>
      </div>
    </header>
  );
};

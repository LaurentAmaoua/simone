import styles from "./_styles/Header.module.css";

export const Header = () => {
  return (
    <header className={styles.container}>
      <h1 className={styles.title}>PLANICAMPING</h1>
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
    </header>
  );
};

import React from 'react';
import styles from '../styles/ChatBotStyles.module.css';

const Footer: React.FC = () => {
  return (
    <div className={styles.footer}>
      Powered by <a href="https://gemini.google.com/" className={styles.link}>Google Gemini 1.5 Pro</a>
    </div>
  );
};

export default Footer;

import React from 'react';
import { Icon } from '@iconify/react';
import styles from '../styles/ChatBotStyles.module.css';

const Header: React.FC = () => {
  return (
    <div className={styles.header}>
      <div className={styles.logoContainer}>
        <div className={styles.logo}>
          <Icon icon="fluent:bot-sparkle-24-regular" width="40" height="40" color="black" />
        </div>
        <span className={styles.headerTitle}>StarBot</span>
      </div>
    </div>
  );
};

export default Header;

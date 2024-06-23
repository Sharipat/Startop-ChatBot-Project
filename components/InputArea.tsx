import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import styles from '../styles/ChatBotStyles.module.css';

interface InputAreaProps {
  onSendMessage: (message: string) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState<string>('');

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.inputContainer}>
      <input
        type="text"
        id="userInput"
        name="userInput"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="Entrez votre message ici"
        className={styles.input}
      />
      <button onClick={handleSendMessage} className={styles.button}>
        <Icon icon="ion:send-sharp" width="26" height="26" />
      </button>
    </div>
  );
};

export default InputArea;

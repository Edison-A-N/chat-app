import React from 'react';
import ChatInterface from './components/ChatInterface';
import styles from './App.module.css';

const App: React.FC = () => {
    return (
        <div className={styles.app}>
            <ChatInterface />
        </div>
    );
};

export default App;

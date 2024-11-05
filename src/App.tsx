import React, { useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import styles from './App.module.css';
import { ConfigLoader } from './config';
const App: React.FC = () => {
    useEffect(() => {
        const initConfig = async () => {
            await ConfigLoader.getInstance().loadConfig();
        };

        initConfig().catch(console.error);
    }, []);

    return (
        <div className={styles.app}>
            <ChatInterface />
        </div>
    );
};

export default App;

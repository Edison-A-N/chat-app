import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import MainLayout from './components/Layout/MainLayout';
import { ConfigLoader } from './config/configLoader';
import styles from './App.module.css';

const App: React.FC = () => {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initConfig = async () => {
            try {
                await ConfigLoader.getInstance().loadConfig();
            } catch (error) {
                console.error('Failed to initialize config:', error);
            } finally {
                setLoading(false);
            }
        };

        initConfig();
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spin size="large" tip="正在加载配置..." />
            </div>
        );
    }

    return <MainLayout />;
};

export default App;

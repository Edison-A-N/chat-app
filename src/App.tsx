import React, { useEffect, useState } from 'react';
import { Layout, Spin } from 'antd';
import ChatWindow from './components/Chat/ChatWindow';
import Sidebar from './components/Sidebar';
import { ConfigLoader } from './config/configLoader';
import styles from './App.module.css';

const { Content } = Layout;

const App: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(true);

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

    return (
        <Layout className={styles.layout}>
            <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
            <Content className={styles.content}>
                <ChatWindow />
            </Content>
        </Layout>
    );
};

export default App;

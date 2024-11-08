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
    const [chatKey, setChatKey] = useState(0);

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

    const handleNewChat = () => {
        setChatKey(prev => prev + 1);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spin size="large" tip="正在加载配置..." />
            </div>
        );
    }

    return (
        <Layout className={styles.layout}>
            <Sidebar
                collapsed={collapsed}
                onCollapse={setCollapsed}
                onNewChat={handleNewChat}
            />
            <Content className={styles.content}>
                <ChatWindow
                    key={chatKey}
                    onNewChat={handleNewChat}
                />
            </Content>
        </Layout>
    );
};

export default App;

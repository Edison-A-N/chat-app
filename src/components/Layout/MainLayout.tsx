import React, { useState } from 'react';
import { Layout } from 'antd';
import ChatWindow from '../Chat/ChatWindow';
import Sidebar from '../Sidebar';
import ConfigEditor from '../ConfigEditor';
import styles from './MainLayout.module.css';

const { Sider, Content } = Layout;

const MainLayout: React.FC = () => {
    const [showConfig, setShowConfig] = useState(false);
    const [collapsed, setCollapsed] = useState(true);
    const [chatKey, setChatKey] = useState(0);

    const handleNewChat = () => {
        setChatKey(prev => prev + 1);
    };

    const handleSettingsClick = () => {
        setShowConfig(!showConfig);
    };

    return (
        <Layout className={styles.layout}>
            <Sider width={250} theme="light" collapsed={collapsed}>
                <Sidebar
                    onNewChat={handleNewChat}
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    onSettingsClick={handleSettingsClick}
                />
            </Sider>
            <Content className={styles.contentWrapper}>
                <div className={`${styles.chatContainer} ${showConfig ? styles.withConfig : ''}`}>
                    <ChatWindow
                        key={chatKey}
                        onNewChat={handleNewChat}
                    />
                </div>
                <div className={`${styles.configContainer} ${showConfig ? styles.visible : ''}`}>
                    <ConfigEditor onClose={() => setShowConfig(false)} />
                </div>
            </Content>
        </Layout>
    );
};

export default MainLayout;

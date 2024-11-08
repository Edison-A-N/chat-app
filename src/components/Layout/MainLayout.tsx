import React from 'react';
import { Layout } from 'antd';
import ChatWindow from '../Chat/ChatWindow';
import Sidebar from './Sidebar';
import styles from './MainLayout.module.css';

const { Sider, Content } = Layout;

const MainLayout: React.FC = () => {
    const handleNewChat = () => {
        // 这个引用会传递给 ChatWindow
    };

    return (
        <Layout className={styles.layout}>
            <Sider width={250} theme="light">
                <Sidebar onNewChat={handleNewChat} />
            </Sider>
            <Content>
                <ChatWindow onNewChat={handleNewChat} />
            </Content>
        </Layout>
    );
};

export default MainLayout;

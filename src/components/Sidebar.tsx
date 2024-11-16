import React, { useState, useEffect } from 'react';
import { Layout, Button } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    PlusOutlined
} from '@ant-design/icons';
import styles from './Sidebar.module.css';
import { conversationService, type Conversation } from '../services/conversation';

const { Sider } = Layout;

interface SidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
    onNewChat: () => void;
    onSettingsClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse, onNewChat, onSettingsClick }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadConversations = async () => {
            setLoading(true);
            try {
                const data = await conversationService.listConversations();
                console.log('data', data);
                setConversations(data);
            } catch (error) {
                console.error('Failed to load conversations:', error);
            } finally {
                setLoading(false);
            }
        };

        loadConversations();
    }, []);

    const recentConversations = conversations.slice(0, 5);

    const getShortSubject = (subject: string) => {
        return collapsed ? subject.slice(0, 4) + '...' : subject;
    };

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            className={styles.sidebar}
            theme="light"
            width={250}
        >
            <div className={styles.collapseButton}>
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => onCollapse(!collapsed)}
                    block
                />
            </div>

            <div className={styles.sidebarContent}>
                <Button
                    type="text"
                    icon={<PlusOutlined />}
                    block
                    className={styles.actionButton}
                    onClick={onNewChat}
                >
                    {!collapsed && '新建对话'}
                </Button>

                <div className={styles.conversationList}>
                    {!loading && recentConversations.map((conv) => (
                        <Button
                            key={conv.id}
                            type="text"
                            block
                            className={`${styles.conversationItem} ${collapsed ? styles.collapsedItem : ''}`}
                            title={conv.subject}
                        >
                            <span className={styles.conversationSubject}>
                                {getShortSubject(conv.subject)}
                            </span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className={styles.settingsButton}>
                <Button
                    type="text"
                    icon={<SettingOutlined />}
                    onClick={onSettingsClick}
                    block
                >
                    {!collapsed && '设置'}
                </Button>
            </div>
        </Sider>
    );
};

export default Sidebar;

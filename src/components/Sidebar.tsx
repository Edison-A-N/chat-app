import React, { useEffect } from 'react';
import { Layout, Button } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    PlusOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import styles from './Sidebar.module.css';
import { useConversationStore } from '../stores/conversationStore';
import { Conversation } from '../types/conversation';
import { formatDateTime } from '../utils/datetime';

const { Sider } = Layout;

interface SidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
    onNewChat: () => void;
    onSettingsClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse, onNewChat, onSettingsClick }) => {
    const { conversations, loading, init, setCurrentChat, currentChat, deleteConversation } = useConversationStore();

    useEffect(() => {
        init();
    }, [init]);

    const recentConversations = conversations.slice(0, 5);

    const getShortSubject = (subject: string) => {
        return collapsed ? subject.slice(0, 4) + '...' : subject;
    };

    const handleConversationClick = (conversation: Conversation) => {
        setCurrentChat(conversation);
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        await deleteConversation(id);
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
                        <div
                            key={conv.id}
                            className={`${styles.conversationWrapper} ${currentChat?.id === conv.id ? styles.activeItem : ''}`}
                        >
                            <Button
                                type="text"
                                block
                                className={`
                                    ${styles.conversationItem}
                                    ${collapsed ? styles.collapsedItem : ''}
                                `}
                                title={`${conv.subject}${collapsed ? '\n' + formatDateTime(conv.timestamp) : ''}`}
                                onClick={() => handleConversationClick(conv)}
                            >
                                <div className={styles.conversationContent}>
                                    <span className={styles.conversationSubject}>
                                        {getShortSubject(conv.subject)}
                                    </span>
                                    {!collapsed && (
                                        <span className={styles.conversationTime}>
                                            {formatDateTime(conv.timestamp)}
                                        </span>
                                    )}
                                </div>
                            </Button>
                            <DeleteOutlined
                                className={`${styles.deleteIcon} ${collapsed ? styles.collapsedDeleteIcon : ''}`}
                                onClick={(e) => handleDelete(e, conv.id)}
                            />
                        </div>
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

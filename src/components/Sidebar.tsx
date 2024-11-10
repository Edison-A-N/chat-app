import React from 'react';
import { Layout, Button } from 'antd';
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    MessageOutlined,
    PlusOutlined
} from '@ant-design/icons';
import styles from './Sidebar.module.css';

const { Sider } = Layout;

interface SidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
    onNewChat: () => void;
    onSettingsClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse, onNewChat, onSettingsClick }) => {
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
                <Button
                    type="text"
                    icon={<MessageOutlined />}
                    block
                    className={styles.actionButton}
                >
                    {!collapsed && '对话列表'}
                </Button>
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

import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from './Sidebar.module.css';

interface SidebarProps {
    onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onNewChat }) => {
    return (
        <div className={styles.sidebar}>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onNewChat}
                className={styles.newChatButton}
            >
                新建对话
            </Button>
            {/* 这里可以后续添加对话历史列表 */}
        </div>
    );
};

export default Sidebar;

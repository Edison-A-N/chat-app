import React from 'react';
import { Layout, Button, Drawer } from 'antd';
import { SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import styles from './Sidebar.module.css';
import { useState } from 'react';
import ConfigEditor from './ConfigEditor';

const { Sider } = Layout;

interface SidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onCollapse }) => {
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <>
            <Sider
                className={styles.sidebar}
                collapsible
                collapsed={collapsed}
                onCollapse={onCollapse}
                width="20%"
                collapsedWidth={80}
                trigger={null}
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
                    {/* 这里可以添加其他侧边栏内容 */}
                </div>

                <div className={styles.settingsButton}>
                    <Button
                        type="text"
                        icon={<SettingOutlined />}
                        onClick={() => setSettingsOpen(true)}
                        block
                    />
                </div>
            </Sider>

            <Drawer
                title="系统设置"
                placement="right"
                onClose={() => setSettingsOpen(false)}
                open={settingsOpen}
                width={400}
            >
                <ConfigEditor />
            </Drawer>
        </>
    );
};

export default Sidebar;

import React, { useState } from 'react';
import { Layout, Button, Drawer } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import ConfigEditor from '../ConfigEditor';

const { Sider, Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const [showSettings, setShowSettings] = useState(false);

    return (
        <Layout style={{ height: '100vh' }}>
            <Sider
                theme="light"
                width={250}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: '1px solid #f0f0f0'
                }}
            >
                <div style={{ flex: 1, padding: '20px' }}>
                    {/* 这里可以放置聊天历史或其他导航内容 */}
                </div>
                <div style={{ padding: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <Button
                        type="text"
                        icon={<SettingOutlined />}
                        onClick={() => setShowSettings(true)}
                        block
                    >
                        系统设置
                    </Button>
                </div>
            </Sider>

            <Content style={{ padding: '24px', overflow: 'auto' }}>
                {children}
            </Content>

            <Drawer
                title="系统设置"
                placement="right"
                width={650}
                onClose={() => setShowSettings(false)}
                open={showSettings}
            >
                <ConfigEditor onSaved={() => setShowSettings(false)} />
            </Drawer>
        </Layout>
    );
};

export default MainLayout;

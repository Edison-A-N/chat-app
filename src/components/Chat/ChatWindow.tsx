import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined } from '@ant-design/icons';
import { BedrockService } from '../../services/aws/bedrock';
import styles from './ChatWindow.module.css';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

const ChatWindow: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const bedrockService = BedrockService.getInstance();
    const [currentStreamingContent, setCurrentStreamingContent] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: inputValue.trim(),
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setLoading(true);
        setCurrentStreamingContent('');

        try {
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            await bedrockService.streamChat(
                inputValue.trim(),
                (chunk: string, isComplete: boolean) => {
                    setCurrentStreamingContent(chunk);
                    if (isComplete) {
                        setMessages(prev => prev.map((msg, index) => {
                            if (index === prev.length - 1) {
                                return { ...msg, content: chunk };
                            }
                            return msg;
                        }));
                    }
                }
            );
        } catch (error) {
            console.error('Chat error:', error);
            message.error('发送消息失败，请检查配置或网络连接');
        } finally {
            setLoading(false);
            setCurrentStreamingContent('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Card
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
            bodyStyle={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                padding: '12px',
                overflow: 'hidden'
            }}
        >
            <div className={styles.messageList}>
                <List
                    itemLayout="horizontal"
                    dataSource={messages}
                    renderItem={(item, index) => (
                        <List.Item className={item.role === 'user' ? styles.userMessage : styles.assistantMessage}>
                            <List.Item.Meta
                                avatar={
                                    <Avatar icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />} />
                                }
                                description={
                                    <div className={styles.messageContent}>
                                        {index === messages.length - 1 && item.role === 'assistant'
                                            ? currentStreamingContent || item.content
                                            : item.content}
                                    </div>
                                }
                            />
                        </List.Item>
                    )}
                />
                <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
                <Input.TextArea
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    disabled={loading}
                    className={styles.textarea}
                />
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={loading}
                    disabled={!inputValue.trim()}
                >
                    发送
                </Button>
            </div>
        </Card>
    );
};

export default ChatWindow;

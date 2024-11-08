import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, message } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, StopOutlined } from '@ant-design/icons';
import { BedrockService } from '../../services/aws/bedrock';
import styles from './ChatWindow.module.css';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ChatWindowProps {
    onNewChat?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onNewChat }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<any>(null);
    const bedrockService = BedrockService.getInstance();
    const [currentStreamingContent, setCurrentStreamingContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentStreamingContent]);

    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const focusInput = () => {
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

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
        setIsGenerating(true);
        setCurrentStreamingContent('');

        try {
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: '',
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, assistantMessage]);

            const messageHistory = messages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));
            messageHistory.push({ role: 'user', content: inputValue.trim() });

            await bedrockService.streamChat(
                messageHistory,
                (chunk: string, isComplete: boolean) => {
                    setCurrentStreamingContent(chunk);
                    if (isComplete) {
                        setMessages(prev => prev.map((msg, index) => {
                            if (index === prev.length - 1) {
                                return { ...msg, content: chunk };
                            }
                            return msg;
                        }));
                        setIsGenerating(false);
                        focusInput();
                    }
                }
            );
        } catch (error) {
            console.error('Chat error:', error);
            message.error('发送消息失败，请检查配置或网络连接');
            focusInput();
        } finally {
            setLoading(false);
            setIsGenerating(false);
            setCurrentStreamingContent('');
        }
    };

    const handleStop = () => {
        bedrockService.abortStreaming();
        setMessages(prev => prev.map((msg, index) => {
            if (index === prev.length - 1) {
                return { ...msg, content: currentStreamingContent };
            }
            return msg;
        }));
        setIsGenerating(false);
        setLoading(false);
        focusInput();
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleNewChat = () => {
        setMessages([]);
        setInputValue('');
        setCurrentStreamingContent('');
        setIsGenerating(false);
        setLoading(false);
        if (onNewChat) {
            onNewChat();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                handleNewChat();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
            <div className={`${styles.messageList} custom-scroll`}>
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
                    ref={inputRef}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="输入消息..."
                    autoSize={{ minRows: 2, maxRows: 6 }}
                    disabled={loading}
                    className={styles.textarea}
                    autoFocus
                />
                <Button
                    type="primary"
                    icon={isGenerating ? <StopOutlined /> : <SendOutlined />}
                    onClick={isGenerating ? handleStop : handleSend}
                    loading={loading && !isGenerating}
                    disabled={!isGenerating && !inputValue.trim()}
                >
                    {isGenerating ? '停止' : '发送'}
                </Button>
            </div>
        </Card>
    );
};

export default ChatWindow;

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, Input, Button, List, Avatar, message, Alert } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, StopOutlined, ExpandAltOutlined, ShrinkOutlined } from '@ant-design/icons';
import { LLMServiceFactoryImpl } from '../../services/llm/factory';
import { useConfigStore } from '../../stores/configStore';
import { useConversationStore } from '../../stores/conversationStore';
import styles from './ChatWindow.module.css';
import ReactMarkdown from 'react-markdown';
import '../../styles/markdown.css';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    error?: boolean;
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
    const [currentStreamingContent, setCurrentStreamingContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputReady, setInputReady] = useState(false);

    const llmService = useMemo(() =>
        LLMServiceFactoryImpl.getInstance().createService(),
        []
    );

    const { currentChat, createNewChat, updateCurrentChat, setCurrentChat } = useConversationStore();


    useEffect(() => {
        if (currentChat) {
            setMessages(
                currentChat.content.messages.map(msg => ({
                    ...msg,
                    timestamp: msg.timestamp || Date.now(),
                }))
            );
        }
    }, [currentChat]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, currentStreamingContent]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setInputReady(true);
            inputRef.current?.focus();
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    const focusInput = () => {
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    useEffect(() => {
        message.config({
            duration: 10,
            maxCount: 1,
            top: 24,
        });
    }, []);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: inputValue.trim(),
            timestamp: Date.now(),
        };

        let isNewChat = messages.length === 0;
        if (isNewChat) {
            messages.push(llmService.messageBuilder().addSystemMessage("You are a helpful assistant that answers questions and helps with tasks.").build()[0]);
        }

        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputValue('');
        setLoading(true);
        setIsGenerating(true);
        setCurrentStreamingContent('');

        try {
            const messageHistory = newMessages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
            }));

            let isFirstChunk = true;

            await llmService.streamChat(
                messageHistory,
                (chunk: string, isComplete: boolean) => {
                    if (isFirstChunk) {
                        const assistantMessage: ChatMessage = {
                            role: 'assistant',
                            content: '',
                            timestamp: Date.now(),
                            error: false
                        };
                        setMessages(prev => [...prev, assistantMessage]);
                        isFirstChunk = false;

                        if (isNewChat) {
                            const subject = userMessage.content.slice(0, 30) + (userMessage.content.length > 30 ? '...' : '');
                            createNewChat(subject, [...messages, assistantMessage]);
                        }
                    }

                    setCurrentStreamingContent(chunk);

                    if (isComplete) {
                        setMessages(prev => {
                            const updatedMessages = prev.map((msg, index) => {
                                if (index === prev.length - 1) {
                                    return {
                                        ...msg,
                                        content: chunk,
                                        timestamp: Date.now()
                                    };
                                }
                                return msg;
                            });

                            const completeMessageHistory = updatedMessages.map(msg => ({
                                role: msg.role,
                                content: msg.content,
                                timestamp: msg.timestamp,
                            }));

                            updateCurrentChat(completeMessageHistory);
                            return updatedMessages;
                        });
                        setIsGenerating(false);
                        focusInput();
                    }
                }
            );
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = (error as Error).message || 'Failed to send message. Please check your configuration or network connection';
            message.error({
                content: errorMessage,
                className: styles.errorMessage,
                onClick: () => message.destroy()
            });
            setMessages(prev => prev.map((msg, index) => {
                if (index === prev.length - 1) {
                    return { ...msg, content: (error as Error).message, error: true };
                }
                return msg;
            }));
            focusInput();
        } finally {
            setLoading(false);
            setIsGenerating(false);
            setCurrentStreamingContent('');
        }
    };

    const handleStop = () => {
        llmService.abortStreaming();
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
        setCurrentChat(null);
        focusInput();
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

    useEffect(() => {
        const unsubscribe = useConfigStore.subscribe(
            (state, prevState) => {
                if (JSON.stringify(state.config) !== JSON.stringify(prevState.config)) {
                    handleNewChat();
                }
            }
        );

        return () => unsubscribe();
    }, []);

    const renderMarkdownContent = (content: string) => {
        const parts = content.split(/(<think>|<\/think>)/);
        let isInThinkBlock = false;

        return (
            <div className={styles.messageContentWrapper}>
                {parts.map((part, index) => {
                    if (part === '<think>') {
                        isInThinkBlock = true;
                        return null;
                    } else if (part === '</think>') {
                        isInThinkBlock = false;
                        return null;
                    }

                    if (isInThinkBlock) {
                        return (
                            <Alert
                                key={`thinking-${index}`}
                                message={part.trim()}
                                type="info"
                                className={styles.thinkBlock}
                            />
                        );
                    }

                    return part ? (
                        <div key={index} className={styles.markdownWrapper}>
                            <ReactMarkdown className="markdown-content">
                                {part}
                            </ReactMarkdown>
                        </div>
                    ) : null;
                })}
            </div>
        );
    };

    return (
        <Card
            style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
            className={styles.body}
        >
            <div className={styles.chatContainer}>
                <div className={`${styles.messageList} custom-scroll`}>
                    <List
                        itemLayout="horizontal"
                        dataSource={messages}
                        renderItem={(item, index) => (
                            <List.Item
                                className={`
                                    ${item.role === 'user' ? styles.userMessage : styles.assistantMessage}
                                    ${item.error ? styles.errorMessage : ''}
                                `}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <Avatar icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />} />
                                    }
                                    description={
                                        <div>
                                            <div className={styles.messageContent}>
                                                {item.role === 'user' ? (
                                                    item.content
                                                ) : (
                                                        index === messages.length - 1 && isGenerating
                                                            ? renderMarkdownContent(currentStreamingContent)
                                                            : renderMarkdownContent(item.content)
                                                )}
                                            </div>
                                            <div className={styles.messageTimestamp}>
                                                {new Date(item.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                    <div ref={messagesEndRef} />
                </div>

                <div className={`${styles.inputContainer} ${isExpanded ? styles.expanded : ''}`}>
                    {isExpanded && (
                        <Button
                            className={styles.shrinkButton}
                            icon={<ShrinkOutlined />}
                            onClick={() => setIsExpanded(false)}
                        />
                    )}
                    <div className={styles.inputWrapper}>
                        <Input.TextArea
                            ref={inputRef}
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter message..."
                            autoSize={inputReady ? (isExpanded ? { minRows: 8, maxRows: 12 } : { minRows: 1, maxRows: 4 }) : false}
                            disabled={loading}
                            className={styles.textarea}
                            style={{ height: !inputReady ? '32px' : undefined }}
                            autoFocus
                        />
                        <div className={styles.buttonGroup}>
                            {!isExpanded && (
                                <Button
                                    className={styles.expandButton}
                                    icon={<ExpandAltOutlined />}
                                    onClick={() => setIsExpanded(true)}
                                />
                            )}
                            <Button
                                className={styles.sendButton}
                                icon={isGenerating ? <StopOutlined /> : <SendOutlined />}
                                onClick={isGenerating ? handleStop : handleSend}
                                loading={loading && !isGenerating}
                                disabled={!isGenerating && !inputValue.trim()}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default ChatWindow;

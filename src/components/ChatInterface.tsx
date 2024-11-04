import React, { useState, useEffect, useRef } from 'react';
import { getStreamingResponseFromBedrock } from '../services/aws/bedrock';
import styles from './ChatInterface.module.css';
import { Message } from '../types/chat';

const ChatInterface: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const chatAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!prompt.trim() || isTyping) return;

        const userMessage = prompt.trim();
        setPrompt('');
        setIsTyping(true);

        setMessages(prev => [...prev, { text: userMessage, type: 'user' }]);

        try {
            setMessages(prev => [...prev, { text: '', type: 'assistant' }]);

            await getStreamingResponseFromBedrock(
                userMessage,
                (chunk, isComplete) => {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMessage = newMessages[newMessages.length - 1];
                        if (lastMessage && lastMessage.type === 'assistant') {
                            lastMessage.text = chunk;
                        }
                        return newMessages;
                    });

                    if (isComplete) {
                        setIsTyping(false);
                    }
                }
            );
        } catch (error) {
            console.error('Error fetching response:', error);
            let errorMessage = 'Sorry, there was an error getting the response.';

            if (error instanceof Error) {
                if (error.message.includes('credentials')) {
                    errorMessage = 'Failed to authenticate with AWS. Please check your credentials.';
                } else if (error.message.includes('network')) {
                    errorMessage = 'Network error. Please check your internet connection.';
                }
            }

            setMessages(prev => [
                ...prev.slice(0, -1),
                { text: errorMessage, type: 'assistant' }
            ]);
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.chatArea} ref={chatAreaRef}>
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`${styles.message} ${
                            message.type === 'user' ? styles.userMessage : styles.botMessage
                        }`}
                    >
                        {message.text || (
                            message.type === 'assistant' &&
                            <span className={styles.typing}>AI is typing...</span>
                        )}
                    </div>
                ))}
            </div>
            <div className={styles.inputArea}>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message here..."
                    className={styles.input}
                    disabled={isTyping}
                />
                <button
                    onClick={handleSend}
                    disabled={isTyping || !prompt.trim()}
                    className={styles.sendButton}
                >
                    Send
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;

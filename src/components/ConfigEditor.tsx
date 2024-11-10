import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Spin, Collapse, Select } from 'antd';
import { UserConfig } from '../types/config';
import { ConfigLoader } from '../config/configLoader';
import styles from './ConfigEditor.module.css';

interface ConfigEditorProps {
    onSaved?: () => void;
    onClose: () => void;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({ onSaved }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [currentProvider, setCurrentProvider] = useState<string>();
    const configLoader = ConfigLoader.getInstance();

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const currentConfig = configLoader.getConfig();
            form.setFieldsValue({
                aws: {
                    accessKeyId: currentConfig.aws.credentials.accessKeyId,
                    secretAccessKey: currentConfig.aws.credentials.secretAccessKey,
                    region: currentConfig.aws.region,
                    bedrock: {
                        modelId: currentConfig.aws.bedrock.modelId,
                        maxTokens: currentConfig.aws.bedrock.maxTokens,
                        temperature: currentConfig.aws.bedrock.temperature,
                        topP: currentConfig.aws.bedrock.topP,
                        anthropicVersion: currentConfig.aws.bedrock.anthropicVersion
                    }
                },
                google: {
                    apiKey: currentConfig.google.apiKey
                },
                llm: {
                    provider: currentConfig.llm.provider
                },
                chat: {
                    maxHistoryLength: currentConfig.chat.maxHistoryLength
                }
            });
        } catch (error) {
            message.error('Failed to load configuration');
            console.error('Failed to load config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: UserConfig) => {
        setLoading(true);
        try {
            await configLoader.saveConfig(values);
            message.success('Configuration saved successfully');
            onSaved?.();
        } catch (error) {
            message.error('Failed to save configuration');
            console.error('Failed to save config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProviderChange = (value: string) => {
        setCurrentProvider(value);
        if (value.startsWith('bedrock')) {
            form.setFieldsValue({
                google: { apiKey: undefined }
            });
        } else if (value === 'gemini') {
            form.setFieldsValue({
                aws: {
                    accessKeyId: undefined,
                    secretAccessKey: undefined,
                    region: undefined,
                    bedrock: {
                        modelId: undefined,
                        maxTokens: undefined,
                        temperature: undefined,
                        topP: undefined,
                        anthropicVersion: undefined
                    }
                }
            });
        }
    };

    const isAwsRequired = (provider?: string) => {
        return provider?.startsWith('bedrock') ?? false;
    };

    const isGoogleRequired = (provider?: string) => {
        return provider === 'gemini';
    };

    return (
        <div className={styles.container}>
            <Card bordered={false}>
                <Spin spinning={loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        disabled={loading}
                    >
                        <Form.Item
                            label="LLM Provider"
                            name={['llm', 'provider']}
                            rules={[{ required: true, message: 'Please select LLM Provider' }]}
                        >
                            <Select onChange={handleProviderChange}>
                                <Select.Option value="bedrock">Amazon Bedrock (Claude)</Select.Option>
                                <Select.Option value="gemini">Google Gemini</Select.Option>
                            </Select>
                        </Form.Item>

                        <Collapse
                            defaultActiveKey={['aws', 'google', 'chat']}
                            items={[
                                {
                                    key: 'aws',
                                    label: 'AWS Configuration',
                                    children: (
                                        <>
                                            <Form.Item
                                                label="AWS Access Key ID"
                                                name={['aws', 'accessKeyId']}
                                                rules={[
                                                    { required: isAwsRequired(currentProvider), message: 'Please enter AWS Access Key ID' },
                                                    { min: 20, message: 'Invalid Access Key ID length' }
                                                ]}
                                            >
                                                <Input placeholder="Enter AWS Access Key ID" />
                                            </Form.Item>

                                            <Form.Item
                                                label="AWS Secret Access Key"
                                                name={['aws', 'secretAccessKey']}
                                                rules={[
                                                    { required: isAwsRequired(currentProvider), message: 'Please enter AWS Secret Access Key' },
                                                    { min: 40, message: 'Invalid Secret Access Key length' }
                                                ]}
                                            >
                                                <Input.Password placeholder="Enter AWS Secret Access Key" />
                                            </Form.Item>

                                            <Form.Item
                                                label="AWS Region"
                                                name={['aws', 'region']}
                                                rules={[
                                                    { required: true, message: 'Please enter AWS Region' },
                                                    { pattern: /^[a-z]{2}-[a-z]+-\d{1}$/, message: 'Please enter a valid AWS Region format, e.g., us-east-1' }
                                                ]}
                                            >
                                                <Input placeholder="e.g., us-east-1" />
                                            </Form.Item>

                                            <Form.Item
                                                label="Model ID"
                                                name={['aws', 'bedrock', 'modelId']}
                                                rules={[{ required: true, message: 'Please select Model ID' }]}
                                            >
                                                <Input placeholder="e.g., anthropic.claude-v2" />
                                            </Form.Item>

                                            <Form.Item
                                                label="Max Tokens"
                                                name={['aws', 'bedrock', 'maxTokens']}
                                                rules={[{ required: true, message: 'Please enter Max Tokens' }]}
                                            >
                                                <Input type="number" placeholder="e.g., 4096" />
                                            </Form.Item>

                                            <Form.Item
                                                label="Temperature"
                                                name={['aws', 'bedrock', 'temperature']}
                                                rules={[
                                                    { required: true, message: 'Please enter temperature' },
                                                    { type: 'number', min: 0, max: 1, message: 'Temperature must be between 0-1' }
                                                ]}
                                                normalize={(value) => {
                                                    if (value === '' || value === null || value === undefined) return undefined;
                                                    return Number(value);
                                                }}
                                            >
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min={0}
                                                    max={1}
                                                    placeholder="e.g., 0.7"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                label="Top P"
                                                name={['aws', 'bedrock', 'topP']}
                                                rules={[
                                                    { required: true, message: 'Please enter Top P' },
                                                    { type: 'number', min: 0, max: 1, message: 'Top P must be between 0-1' }
                                                ]}
                                                normalize={(value) => {
                                                    if (value === '' || value === null || value === undefined) return undefined;
                                                    return Number(value);
                                                }}
                                            >
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min={0}
                                                    max={1}
                                                    placeholder="e.g., 0.7"
                                                />
                                            </Form.Item>

                                            <Form.Item
                                                label="Anthropic Version"
                                                name={['aws', 'bedrock', 'anthropicVersion']}
                                                rules={[{ required: true, message: 'Please enter Anthropic Version' }]}
                                            >
                                                <Input placeholder="e.g., bedrock-2023-05-31" />
                                            </Form.Item>
                                        </>
                                    )
                                },
                                {
                                    key: 'google',
                                    label: 'Google Configuration',
                                    children: (
                                        <Form.Item
                                            label="Google API Key"
                                            name={['google', 'apiKey']}
                                            rules={[
                                                { required: isGoogleRequired(currentProvider), message: 'Please enter Google API Key' },
                                                { min: 39, message: 'Invalid API Key length' }
                                            ]}
                                        >
                                            <Input.Password placeholder="Enter Google API Key" />
                                        </Form.Item>
                                    )
                                },
                                {
                                    key: 'chat',
                                    label: 'Chat Configuration',
                                    children: (
                                        <Form.Item
                                            label="Max History Length"
                                            name={['chat', 'maxHistoryLength']}
                                            rules={[
                                                { required: true, message: 'Please enter Max History Length' },
                                                { type: 'number', min: 1, message: 'Minimum length is 1' }
                                            ]}
                                        >
                                            <Input type="number" placeholder="e.g., 50" />
                                        </Form.Item>
                                    )
                                }
                            ]}
                        />
                    </Form>
                </Spin>
                <div className={styles.footer}>
                    <Button
                        type="primary"
                        onClick={() => form.submit()}
                        loading={loading}
                    >
                        Save Configuration
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ConfigEditor;

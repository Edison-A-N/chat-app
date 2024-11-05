import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Spin, Collapse } from 'antd';
import { UserConfig } from '../types/config';
import { ConfigLoader } from '../config/configLoader';

interface ConfigEditorProps {
    onSaved?: () => void;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({ onSaved }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
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
                }
            });
        } catch (error) {
            message.error('加载配置失败');
            console.error('Failed to load config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (values: UserConfig) => {
        setLoading(true);
        try {
            await configLoader.saveConfig(values);
            message.success('配置保存成功');
            onSaved?.();
        } catch (error) {
            message.error('配置保存失败');
            console.error('Failed to save config:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card bordered={false} style={{ maxWidth: 600, margin: '0 auto' }}>
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    disabled={loading}
                >
                    <Collapse
                        defaultActiveKey={['aws', 'bedrock']}
                        items={[
                            {
                                key: 'aws',
                                label: 'AWS 配置',
                                children: (
                                    <>
                                        <Form.Item
                                            label="AWS Access Key ID"
                                            name={['aws', 'accessKeyId']}
                                            rules={[
                                                { required: true, message: '请输入 AWS Access Key ID' },
                                                { min: 20, message: 'Access Key ID 长度不正确' }
                                            ]}
                                        >
                                            <Input placeholder="请输入 AWS Access Key ID" />
                                        </Form.Item>

                                        <Form.Item
                                            label="AWS Secret Access Key"
                                            name={['aws', 'secretAccessKey']}
                                            rules={[
                                                { required: true, message: '请输入 AWS Secret Access Key' },
                                                { min: 40, message: 'Secret Access Key 长度不正确' }
                                            ]}
                                        >
                                            <Input.Password placeholder="请输入 AWS Secret Access Key" />
                                        </Form.Item>

                                        <Form.Item
                                            label="AWS Region"
                                            name={['aws', 'region']}
                                            rules={[
                                                { required: true, message: '请输入 AWS Region' },
                                                { pattern: /^[a-z]{2}-[a-z]+-\d{1}$/, message: '请输入正确的 AWS Region 格式，例如：us-east-1' }
                                            ]}
                                        >
                                            <Input placeholder="例如：us-east-1" />
                                        </Form.Item>

                                        <Form.Item
                                            label="模型 ID"
                                            name={['aws', 'bedrock', 'modelId']}
                                            rules={[{ required: true, message: '请选择模型 ID' }]}
                                        >
                                            <Input placeholder="例如：anthropic.claude-v2" />
                                        </Form.Item>

                                        <Form.Item
                                            label="最大 Token 数"
                                            name={['aws', 'bedrock', 'maxTokens']}
                                            rules={[{ required: true, message: '请输入最大 Token 数' }]}
                                        >
                                            <Input type="number" placeholder="例如：4096" />
                                        </Form.Item>

                                        <Form.Item
                                            label="Temperature"
                                            name={['aws', 'bedrock', 'temperature']}
                                            rules={[
                                                { required: true, message: '请输入 temperature' },
                                                { type: 'number', min: 0, max: 1, message: 'Temperature 必须在 0-1 之间' }
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
                                                placeholder="例如：0.7"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Top P"
                                            name={['aws', 'bedrock', 'topP']}
                                            rules={[
                                                { required: true, message: '请输入 Top P' },
                                                { type: 'number', min: 0, max: 1, message: 'Top P 必须在 0-1 之间' }
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
                                                placeholder="例如：0.7"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Anthropic Version"
                                            name={['aws', 'bedrock', 'anthropicVersion']}
                                            rules={[{ required: true, message: '请输入 Anthropic Version' }]}
                                        >
                                            <Input placeholder="例如：bedrock-2023-05-31" />
                                        </Form.Item>
                                    </>
                                )
                            }
                        ]}
                    />

                    <Form.Item style={{ marginTop: 16 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            block
                        >
                            保存配置
                        </Button>
                    </Form.Item>
                </Form>
            </Spin>
        </Card>
    );
};

export default ConfigEditor;

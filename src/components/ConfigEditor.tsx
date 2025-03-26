import React, { useEffect } from 'react';
import { Form, Input, Button, Card, message, Spin, Collapse, Switch } from 'antd';
import { UserConfig } from '../types/config';
import { useConfigStore } from '../stores/configStore';
import styles from './ConfigEditor.module.css';

interface ConfigEditorProps {
    onSaved?: () => void;
    onClose: () => void;
}

const ConfigEditor: React.FC<ConfigEditorProps> = ({ onSaved, onClose }) => {
    const [form] = Form.useForm();
    const { loading, saveConfig, config } = useConfigStore.getState();

    useEffect(() => {
        const initializeForm = async () => {
            try {
                form.setFieldsValue(config);
            } catch (error) {
                message.error('Failed to load configuration');
            }
        };

        initializeForm();
    }, [form]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const container = document.querySelector(`.${styles.container}`);
            const selectDropdown = document.querySelector('.ant-select-dropdown');

            if (container &&
                !container.contains(event.target as Node) &&
                !selectDropdown?.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleSubmit = async (values: UserConfig) => {
        try {
            await saveConfig(values);
            message.success('Configuration saved successfully');
            onSaved?.();
        } catch (error) {
            message.error('Failed to save configuration');
        }
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
                        initialValues={config}
                    >

                        <Collapse
                            destroyInactivePanel={false}
                            items={[
                                {
                                    key: 'openai',
                                    label: 'OpenAI Configuration',
                                    forceRender: true,
                                    children: (
                                        <>
                                            <Form.Item
                                                label="API Key"
                                                name={['openai', 'apiKey']}
                                            >
                                                <Input.Password placeholder="Enter OpenAI API Key" />
                                            </Form.Item>
                                            <Form.Item
                                                label="Endpoint"
                                                name={['openai', 'endpoint']}
                                            >
                                                <Input placeholder="https://your-resource.openai.azure.com" />
                                            </Form.Item>
                                            <Form.Item
                                                label="Model"
                                                name={['openai', 'modelId']}
                                            >
                                                <Input placeholder="Enter model name" />
                                            </Form.Item>
                                            <Form.Item
                                                label="Max Tokens"
                                                name={['openai', 'maxTokens']}
                                            >
                                                <Input type="number" placeholder="e.g., 1000" />
                                            </Form.Item>
                                            <Form.Item
                                                label="Temperature"
                                                name={['openai', 'temperature']}
                                            >
                                                <Input type="number" placeholder="e.g., 0.7" />
                                            </Form.Item>
                                            <Form.Item
                                                label="Top P"
                                                name={['openai', 'topP']}
                                            >
                                                <Input type="number" placeholder="e.g., 0.9" />
                                            </Form.Item>
                                            <Form.Item
                                                label="Stop Sequences"
                                                name={['openai', 'stopSequences']}
                                            >
                                                <Input placeholder="Enter stop sequences" />
                                            </Form.Item>

                                            <Form.Item
                                                label="Enable Streaming"
                                                name={['openai', 'stream']}
                                                valuePropName="checked"
                                            >
                                                <Switch defaultChecked />
                                            </Form.Item>
                                        </>
                                    )
                                },
                                {
                                    key: 'chat',
                                    label: 'Chat Configuration',
                                    forceRender: true,
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
                        onClick={() => form.resetFields()}
                        style={{ marginRight: 8 }}
                    >
                        Reset
                    </Button>
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

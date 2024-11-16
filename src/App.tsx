import React, { useEffect } from 'react';
import MainLayout from './components/Layout/MainLayout';
import useConfigStore from './stores/configStore';
import { useConversationStore } from './stores/conversationStore';

const App: React.FC = () => {
    const loadConfig = useConfigStore(state => state.loadConfig);
    const initConversations = useConversationStore(state => state.init);

    useEffect(() => {
        const initConfig = async () => {
            await loadConfig();
        };

        initConfig();
    }, [loadConfig]);

    useEffect(() => {
        initConversations();
    }, [initConversations]);

    return <MainLayout />;
};

export default App;

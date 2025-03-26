import React, { useEffect, useState } from 'react';
import MainLayout from './components/Layout/MainLayout';
import useConfigStore from './stores/configStore';
import { useConversationStore } from './stores/conversationStore';

const App: React.FC = () => {
    const [isLoading, setIsLoading] = useState(true);
    const loadConfig = useConfigStore(state => state.loadConfig);
    const initConversations = useConversationStore(state => state.init);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                await Promise.all([
                    loadConfig(),
                    initConversations()
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        initializeApp();
    }, [loadConfig, initConversations]);

    if (isLoading) {
        return <div>Loading...</div>; // Or a proper loading spinner
    }

    return <MainLayout />;
};

export default App;

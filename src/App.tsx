import React, { useEffect } from 'react';
import MainLayout from './components/Layout/MainLayout';
import useConfigStore from './stores/configStore';
import { conversationService } from './services/conversation';

const App: React.FC = () => {
    const loadConfig = useConfigStore(state => state.loadConfig);

    useEffect(() => {

        const initConfig = async () => {
            await loadConfig();
        };

        initConfig();
    }, [loadConfig]);

    useEffect(() => {
        conversationService.init();
    }, []);

    return <MainLayout />;
};

export default App;

import React from 'react';
import TabsComponent from '@/components/tabs/tabs'
import GrandTotalComponent from '@/components/grand-total/grand-total';
import TabContentComponent from '@/components/tab-content/tab-content';
import DarkModeButtonComponent from '@/components/dark-mode-button/dark-mode-button';

const App = () => {
  return (
    <div className="app">
      <DarkModeButtonComponent />
      <GrandTotalComponent />
      <TabsComponent />
      <TabContentComponent />
    </div>
  );
}

export default App;
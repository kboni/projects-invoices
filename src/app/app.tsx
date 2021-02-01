import React from 'react';
import TabsComponent from '@/components/tabs/tabs'
import GrandTotalComponent from '@/components/grand-total/grand-total';
import TabContentComponent from '@/components/tab-content/tab-content';

const App = () => {
  return (
    <div className="app">
      <GrandTotalComponent />
      <TabsComponent />
      <TabContentComponent />
    </div>
  );
}

export default App;
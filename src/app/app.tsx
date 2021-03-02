import { useState } from '@hookstate/core';
import GrandTotalComponent from '@reactapp/components/grand-total/grand-total';
import TabContentComponent from '@reactapp/components/tab-content/tab-content';
import TabsComponent from '@reactapp/components/tabs/tabs';
import React, { useEffect } from 'react';
import { TabsEnum } from './models/tabs.enum';
import { checkAllConfig, getDarkMode } from './services/configuration.service';
import { selectedTabState } from './state/tabs.state';

const App = () => {
  const selectedTab = useState(selectedTabState);
  const allConfigOkState = useState(false);

  useEffect(() => {
    checkAllConfig()
    .then((allConfigOk: boolean) => {
        allConfigOkState.set(allConfigOk);
        selectedTab.set(allConfigOk ? TabsEnum.PROJECTS : TabsEnum.CONFIG);
      }),
    getDarkMode()
    .then((darkMode: boolean) => {
      document.body.style.backgroundColor = darkMode ? '#252525' : 'white';
    });
  }, []);
  
  return (
    <div className="app">
      { allConfigOkState.value && <GrandTotalComponent /> }
      <TabsComponent allConfigOk={allConfigOkState.value}/>
      <TabContentComponent />
    </div>
  );
}

export default App;
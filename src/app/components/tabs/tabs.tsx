import { TabsEnum } from "@reactapp/models/tabs.enum";
import { checkAllConfig } from "@reactapp/services/configuration.service";
import { selectedTabState } from "@reactapp/state/tabs.state";
import { useState } from "@hookstate/core";
import React, { useEffect } from "react";
import '@css/tabs.css';

// TODO: what happens if the onTabClick is outside and resolve the 'any'
function* tabRow(tabTitles: TabsEnum[], callbackFn: Function, selectedTab: TabsEnum) {
  for (let tabTitle of tabTitles) {
    yield (
    <button 
      className={ `tablinks ${tabTitle === selectedTab ? 'active' : ''}` } 
      onClick={() => {callbackFn(tabTitle) }} 
      key={tabTitle}>
        {tabTitle}
    </button>);
  }
}

export default function TabsComponent(props: {allConfigOk: boolean}) {
  let tabTitles: TabsEnum[] = [];
  const selectedTab = useState(selectedTabState);

  if (props.allConfigOk) {
    tabTitles = [
      TabsEnum.PROJECTS,
      TabsEnum.SECTIONS,
      TabsEnum.LABELS,
      TabsEnum.CONFIG
    ];
  } else {
      tabTitles = [
        TabsEnum.CONFIG
      ]
  }

  function onTabClick(newSelectedTab: TabsEnum): void {
    selectedTab.set(newSelectedTab);
  }
  return (
    <div className="tab">
      { Array.from(tabRow(tabTitles, onTabClick, selectedTab.get())) }
    </div>);
}
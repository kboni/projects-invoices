import { TabsEnum } from "@/models/tabs.enum";
import { selectedTabState } from "@/state/tabs.state";
import { useState } from "@hookstate/core";
import React from "react";
import '../../../assets/style/tabs.css';

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

export default function TabsComponent() {
  const tabTitles = [
    TabsEnum.PROJECTS,
    TabsEnum.SECTIONS,
    TabsEnum.LABELS
  ];
  const selectedTab = useState(selectedTabState);

  function onTabClick(newSelectedTab: TabsEnum): void {
    selectedTab.set(newSelectedTab);
  }
  return (
    <div className="tab">
      { Array.from(tabRow(tabTitles, onTabClick, selectedTab.get())) }
    </div>);
}
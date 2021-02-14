import { TabsEnum } from '@/models/tabs.enum';
import { selectedTabState } from '@/state/tabs.state';
import { useState } from '@hookstate/core';
import React from 'react';
import ProjectContainerComponent from './components/project-container/project-container';

export default function TabContentComponent() {
    const selectedTab = useState(selectedTabState);
    return (
        <section className="tabcontent">
            { selectedTab.value === TabsEnum.PROJECTS && <ProjectContainerComponent /> }
        </section>
    )
}
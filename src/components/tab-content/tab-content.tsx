import { TabsEnum } from '@/models/tabs.enum';
import { selectedTabState } from '@/state/tabs.state';
import { useState } from '@hookstate/core';
import React from 'react';
import LabelEditorComponent from './components/label-editor/label-editor';
import ProjectContainerComponent from './components/project-container/project-container';

export default function TabContentComponent() {
    const selectedTab = useState(selectedTabState);
    return (
        <section className="tabcontent">
            { selectedTab.value === TabsEnum.PROJECTS && <ProjectContainerComponent tabMode={TabsEnum.PROJECTS} /> }
            { selectedTab.value === TabsEnum.SECTIONS && <ProjectContainerComponent tabMode={TabsEnum.SECTIONS} /> }
            { selectedTab.value === TabsEnum.LABELS && <LabelEditorComponent /> }
        </section>
    )
}
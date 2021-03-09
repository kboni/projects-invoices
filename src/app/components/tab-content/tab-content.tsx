import { TabsEnum } from '@reactapp/models/tabs.enum';
import { selectedTabState } from '@reactapp/state/tabs.state';
import { useState } from '@hookstate/core';
import React from 'react';
import { ConfigurationComponent } from './components/configuration/configuration';
import LabelEditorComponent from './components/label-editor/label-editor';
import ProjectContainerComponent from './components/project-container/project-container';
import { DBTableName } from '@reactapp/models/database-table.enum';

export default function TabContentComponent() {
    const selectedTab = useState(selectedTabState);
    
    return (
        <section className="tabcontent">
            { selectedTab.value === TabsEnum.PROJECTS 
                && <ProjectContainerComponent
                        tabDBProjectTableName={DBTableName.PROJECT}
                        tabDBProjectInvoiceTableName={DBTableName.PROJECT_INVOICE}
                    /> 
            }
            { selectedTab.value === TabsEnum.SECTIONS 
                && <ProjectContainerComponent 
                        tabDBProjectTableName={DBTableName.SECTION}
                        tabDBProjectInvoiceTableName={DBTableName.SECTION_INVOICE}
                    /> 
            }
            { selectedTab.value === TabsEnum.LABELS && <LabelEditorComponent /> }
            { selectedTab.value === TabsEnum.CONFIG && <ConfigurationComponent /> }
        </section>
    )
}
import { TabsEnum } from '@/models/tabs.enum';
import { createState } from '@hookstate/core';

export const selectedTabState = createState(TabsEnum.PROJECTS);
import { TabsEnum } from '@reactapp/models/tabs.enum';
import { createState } from '@hookstate/core';

export const selectedTabState = createState(TabsEnum.CONFIG);
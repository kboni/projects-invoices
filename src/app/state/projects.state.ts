import { OperationEnum } from '@reactapp/models/edit-mode-operations.enum';
import { IProject } from '@reactapp/models/projects.interface';
import { createState } from '@hookstate/core';

export const allProjectsState = createState([] as IProject[]);
export const selectedProjectsState = createState([] as IProject[]);
export const editModeState = createState(false);
export const editModeOperationState = createState(OperationEnum.NONE);
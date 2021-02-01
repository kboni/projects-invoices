import { OperationEnum } from '@/models/edit-mode-operations.enum';
import { IProject } from '@/models/projects.interface';
import { createState } from '@hookstate/core';

export const allProjectsState = createState([] as IProject[]);
export const selectedProjectsState = createState([] as IProject[]);
export const editModeState = createState(false);
export const editModeOperationState = createState(OperationEnum.NONE);
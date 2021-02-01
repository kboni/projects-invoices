import { IProject } from '@/models/projects.interface';
import { createState } from '@hookstate/core';

export const allProjectsState = createState([] as IProject[]);
export const selectedProjectsState = createState([] as IProject[]);
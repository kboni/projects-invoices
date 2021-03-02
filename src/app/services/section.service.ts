import { IProject } from "@reactapp/models/projects.interface";
import { ipcRenderer } from "electron";

export function getAllSections(): Promise<IProject[]> {
  return ipcRenderer.invoke("getAllSections")
}

export function getTotalSumOfAllSectionCosts(): Promise<Array<{sectionCost: number}>> {
  return ipcRenderer.invoke("getTotalSumOfAllSectionCosts")
}

export function insertNewSection(project: IProject): Promise<IProject[]> {
  return ipcRenderer.invoke("insertNewSection", project);
}

export function updateSection(project: IProject): Promise<number> {
  return ipcRenderer.invoke("updateSection", project);
}

export function deleteSections(projects: IProject[]): Promise<number[]> {
  return ipcRenderer.invoke("deleteSections", projects);
}
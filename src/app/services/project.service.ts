import { IProject } from "@reactapp/models/projects.interface";
import { ipcRenderer } from "electron";

export function getAllProjects(): Promise<IProject[]> {
  return ipcRenderer.invoke("getAllProjects")
}

export function getTotalSumOfAllProjectCosts(): Promise<Array<{projectCost: number}>> {
  return ipcRenderer.invoke("getTotalSumOfAllProjectCosts")
}

export function insertNewProject(project: IProject): Promise<IProject[]> {
  return ipcRenderer.invoke("insertNewProject", project);
}

export function updateProject(project: IProject): Promise<number> {
  return ipcRenderer.invoke("updateProject", project);
}

export function deleteProjects(projects: IProject[]): Promise<number[]> {
  return ipcRenderer.invoke("deleteProjects", projects);
}
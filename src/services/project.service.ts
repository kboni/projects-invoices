import { IProject } from "@/models/projects.interface";
import { ipcRenderer } from "electron";

export function getAllProjects(): Promise<IProject[]> {
  return ipcRenderer.invoke("getAllProjects")
}

export function insertNewProject(project: IProject): Promise<number[]> {
  return ipcRenderer.invoke("insertNewProject", project);
}

export function updateProject(project: IProject): Promise<number> {
  return ipcRenderer.invoke("updateProject", project);
}

export function deleteProjects(projects: IProject[]): Promise<any> {
  return ipcRenderer.invoke("deleteProjects", projects);
}
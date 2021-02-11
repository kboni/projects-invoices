import { IProject } from "@/models/projects.interface";
import { ipcRenderer } from "electron";

export function getAllProjects(): Promise<IProject[]> {
  return ipcRenderer.invoke("getAllProjects")
}

export function insertNewProject(project: IProject): Promise<IProject> {
  return ipcRenderer.invoke("insertNewProject", project);
}

export function updateProject(project: IProject): Promise<IProject> {
  return ipcRenderer.invoke("updateProject", project);
}

export function deleteProjects(projects: IProject[]): void {
  ipcRenderer.invoke("deleteProjects", projects);
}
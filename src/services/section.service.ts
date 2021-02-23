import { IProject } from "@/models/projects.interface";
import { ipcRenderer } from "electron";

export function getAllSections(): Promise<IProject[]> {
  return ipcRenderer.invoke("getAllSections")
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
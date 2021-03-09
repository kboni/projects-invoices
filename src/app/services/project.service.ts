import { DBTableName } from "@reactapp/models/database-table.enum";
import { IProject } from "@reactapp/models/projects.interface";
import { ipcRenderer } from "electron";

export function getAllProjects(dbTableName: DBTableName): Promise<IProject[]> {
  return ipcRenderer.invoke("getAllProjects", dbTableName)
}

export function getTotalSumOfAllProjectCosts(dbTableName: DBTableName): Promise<Array<{totalCost: number}>> {
  return ipcRenderer.invoke("getTotalSumOfAllProjectCosts", dbTableName)
}

export function insertNewProject(project: IProject, dbTableName: DBTableName): Promise<IProject[]> {
  return ipcRenderer.invoke("insertNewProject", project, dbTableName);
}

export function updateProject(project: IProject, dbTableName: DBTableName): Promise<number> {
  return ipcRenderer.invoke("updateProject", project, dbTableName);
}

export function deleteProjects(projects: IProject[], dbTableName: DBTableName): Promise<number[]> {
  return ipcRenderer.invoke("deleteProjects", projects, dbTableName);
}
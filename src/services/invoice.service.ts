import { IInvoice } from "@/models/invoices.interface";
import { IProject } from "@/models/projects.interface";
import { ipcRenderer } from "electron";

export function getInvoices(projects: IProject[]): Promise<IInvoice[]> {
  return ipcRenderer.invoke("getInvoices", projects);
}

export function insertNewInvoice(invoice: IInvoice, project: IProject): Promise<IInvoice[]> {
  return ipcRenderer.invoke("insertNewInvoice", invoice, project);
}

export function updateProject(project: IProject): Promise<number> {
  return ipcRenderer.invoke("updateProject", project);
}

export function deleteProjects(projects: IProject[]): Promise<any> {
  return ipcRenderer.invoke("deleteProjects", projects);
}
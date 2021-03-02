import { IElementLabel } from "@reactapp/models/element-labels.interface";
import { ipcRenderer } from "electron";

export function getAllElementLabels(): Promise<IElementLabel[]> {
  return ipcRenderer.invoke("getAllElementLabels");
}

export function insertNewElementLabel(label: IElementLabel): Promise<IElementLabel[]> {
  return ipcRenderer.invoke("insertNewElementLabel", label);
}

export function updateElementLabel(label: IElementLabel): Promise<number> {
  return ipcRenderer.invoke("updateElementLabel", label);
}

export function deleteElementLabel(label: IElementLabel): Promise<number[]> {
  return ipcRenderer.invoke("deleteElementLabel", label);
}
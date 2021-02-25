import { IProject } from "@/models/projects.interface";
import { Option } from "react-multi-select-component/dist/lib/interfaces";
import short from 'short-uuid';
import dateFormat from "dateformat";
import { IInvoice, IInvoiceCheckboxHelper } from "@/models/invoices.interface";

export function mapIProjectsToDropdownOptions(projects: IProject[]): Option[] {
  return projects.map((project: IProject) => {
    return {
      label: project.name,
      value: project.name,
      key: project.uid
    }
  })
}

export function mapDropdownOptionsToIProjects(allProjects: IProject[], options: Option[]): IProject[] {
  if (allProjects.length === options.length) {
    return allProjects;
  }
  
  // TODO: Find a nicer way
  const selectedProjects: IProject[] = [];
  for (let option of options) {
    selectedProjects.push(
      ...allProjects.filter((project: IProject) => project.uid === option.key)
    );
  }
  return selectedProjects;
}

export function generateUid(): string {
  return short.generate();
}

export function formateDateTime(date?: Date): string {
  return date ? dateFormat(date, 'dd.mm.yyyy HH:MM') : '';
}

export function removeItemFromArray(array: string[], item: string): string[] {
  const index = array.indexOf(item);
  if (index > -1) {
    array.splice(index, 1);
  }
  return array;
}

export function cloneObject<T>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}

export function removeItemFromArrayOnce<T>(arr: T[] | undefined, value: T): T[] {
  if (!arr) {
    return [];
  }
  var index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'HRK' }).format(amount);
}
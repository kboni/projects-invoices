import { IProject } from "@/models/projects.interface";
import { Option } from "react-multi-select-component/dist/lib/interfaces";
import short from 'short-uuid';
import dateFormat from "dateformat";
import { IInvoice } from "@/models/invoices.interface";

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

export function generateEmptyProjectObject(): IProject {
  return { 
    uid: '',
    name: '',
    cost: 0,
    description: ''
  }
}

export function generateEmptyInvoiceObject(): IInvoice {
  return { 
    uid: '',
    projectUid: '',
    name: '',
    amount: 0,
    description: '',
    attachment: '',
    elementLabelUid: '',
  }
}

export function generateUid(): string {
  return short.generate();
}

export function formateDateTime(date?: Date): string {
  return date ? dateFormat(date, 'dd.mm.yyyy HH:MM') : '';
}
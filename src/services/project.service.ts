import { IProject } from "@/models/projects.interface";

export function getAllProjects(): IProject[] {
  // TODO: Implement fetching from the DB
  return [
    { uid: 'sd1as3df5', name: 'Project 1', amount: 500000, description: 'Desc'},
    { uid: 'sd1as3r53', name: 'Project 2', amount: 50000, description: 'Desc 2'},
    { uid: 'sdgfs3df5', name: 'Nesto', amount: 10000, description: 'Nest'}
  ];
}

export function insertNewProject(project: IProject): void {
  // TODO: Implement with the DB
}

export function updateProject(project: IProject): void {
  // TODO: Implement with the DB
}

export function deleteProjects(project: IProject[]): void {
  // TODO: Implement with the DB
}
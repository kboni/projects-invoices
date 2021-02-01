export interface IProject {
  uid: string;
  name: string;
  amount: number;
  description: string;
}


export interface IProjectDetailsProps {
  selectedProjects: IProject[];
  editMode: boolean;
}
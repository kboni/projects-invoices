import { OperationEnum } from '@/models/edit-mode-operations.enum';
import { IProject } from '@/models/projects.interface';
import { insertNewProject, updateProject } from '@/services/project.service';
import { generateEmptyProjectObject } from '@/utils/utils';
import React, { ChangeEvent, Dispatch } from 'react';
import '../../../../../../assets/style/project-details-box.css';

export default function ProjectDetailsBoxComponent(
  props: {
    editMode: boolean,
    setEditMode: Dispatch<React.SetStateAction<boolean>>
    editModeOperation: OperationEnum,
    setEditModeOperation: Dispatch<React.SetStateAction<OperationEnum>>,
    projectToEdit: IProject,
    setProjectToEdit: Dispatch<React.SetStateAction<IProject>>,
    getSelectedProjects: Function,
    setSelectedOptions: Function,
    loadAllProjects: Function
}
) {

  function showDetails() {
    console.log('showDetails')
    const currentSelectedProjects: IProject[] = props.getSelectedProjects() as IProject[];
    if (currentSelectedProjects.length === 1) {
      return (
        <p>
          <span>Naziv: {currentSelectedProjects[0].name}</span><br/>
          <span>Iznos: {currentSelectedProjects[0].cost} HRK</span><br/>
          <span>Opis: {currentSelectedProjects[0].description}</span>
        </p>
      )
    }
    let totalAmout = 0;
    for (const project of currentSelectedProjects) {
      totalAmout += project.cost;
    }

    return (
      <p>
        <span>Ukupan iznos oznacenih: {totalAmout} HRK</span><br/>
      </p>
    )
  }
  
  function showAndEditDetails() {

    function onSaveButtonClick() {
      if (props.editModeOperation === OperationEnum.INSERT) {
        insertNewProject(props.projectToEdit)
        .then((insertedProjectIdArray: number[]) => {
          console.log("INSERT")
          console.log(insertedProjectIdArray)
          props.loadAllProjects();
          props.setEditMode(false);
          props.setEditModeOperation(OperationEnum.NONE);
          props.setSelectedOptions([]); // TODO: select newly inserted
        })
        .catch((err: Error) => {
          console.error(err);
          alert(err.message);
        });
      } else if (props.editModeOperation === OperationEnum.UPDATE) {
        updateProject(props.projectToEdit)
        .then((numberOfUpdatedItems: number) => {
          console.log("UPDATE")
          console.log(numberOfUpdatedItems)
          props.loadAllProjects();
          props.setEditMode(false);
          props.setEditModeOperation(OperationEnum.NONE);
        })
        .catch((err: Error) => {
          console.error(err);
          alert(err.message);
        });
      }
      
    }

    function onCancelButtonClick() {
      props.setProjectToEdit(generateEmptyProjectObject());
      props.setEditMode(false);
      props.setEditModeOperation(OperationEnum.NONE);
    }

    function onChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
      props.setProjectToEdit((prevState: IProject) => ({
          ...prevState,
          [event.target.name]: event.target.value
      }));
    }
  
    return (
        <p>
          <span>Naziv: 
            <input type="text"
              value={props.projectToEdit.name} name="name"
              onChange={onChange}
            />
          </span><br/>
          <span>Iznos: 
            <input type="number" 
              value={props.projectToEdit.cost} name="cost"
              onChange={onChange}
            /> 
            HRK
          </span><br/>
          <span>Opis: 
            <textarea
              value={props.projectToEdit.description} name="description"
              onChange={onChange}
            />
          </span> <br/>

          <button onClick={onSaveButtonClick}>Save</button>
          <button onClick={onCancelButtonClick}>Cancel</button>
        </p>
      )
    }

  return (
    <div className="project-details-box">
      <p>
        <span>Detalji projekta:</span>
      </p>
      {props.editMode ? showAndEditDetails() : showDetails()}
    </div>
  );
}
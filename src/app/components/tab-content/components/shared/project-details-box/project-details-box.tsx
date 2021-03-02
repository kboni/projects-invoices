import { OperationEnum } from '@reactapp/models/edit-mode-operations.enum';
import { IProject } from '@reactapp/models/projects.interface';
import { TabsEnum } from '@reactapp/models/tabs.enum';
import { insertNewProject, updateProject } from '@reactapp/services/project.service';
import { insertNewSection, updateSection } from '@reactapp/services/section.service';
import { formatCurrency, mapIProjectsToDropdownOptions } from '@reactapp/utils/utils';
import React, { ChangeEvent, Dispatch } from 'react';
import '@css/project-details-box.css';

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
    loadAllProjects: Function,
    generateEmptyProjectObject: Function,
    tabMode: TabsEnum
}
) {

  function showDetails() {
    console.log('showDetails')
    const currentSelectedProjects: IProject[] = props.getSelectedProjects() as IProject[];
    if (currentSelectedProjects.length === 1) {
      return (
        <p>
          <span>Naziv: {currentSelectedProjects[0].name}</span><br/>
          <span>Iznos: {formatCurrency(currentSelectedProjects[0].cost)}</span><br/>
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
        <span>Ukupan iznos označenih projekata: {formatCurrency(totalAmout)}</span><br/>
      </p>
    )
  }
  
  function showAndEditDetails() {

    function onSaveButtonClick() {
      if (props.editModeOperation === OperationEnum.INSERT) {
        (props.tabMode === TabsEnum.SECTIONS ? insertNewSection(props.projectToEdit) : insertNewProject(props.projectToEdit))
        
        .then((insertedProject: IProject[]) => {
          console.log("INSERT")
          console.log(insertedProject[0])
          props.loadAllProjects();
          onCancelButtonClick();
          props.setSelectedOptions(mapIProjectsToDropdownOptions(insertedProject))
        })
        .catch((err: Error) => {
          console.error(err);
          alert(err.message);
        });
      } else if (props.editModeOperation === OperationEnum.UPDATE) {
        (props.tabMode === TabsEnum.SECTIONS ? updateSection(props.projectToEdit) : updateProject(props.projectToEdit))
        .then((numberOfUpdatedItems: number) => {
          console.log("UPDATE")
          console.log(numberOfUpdatedItems)
          props.loadAllProjects();
          onCancelButtonClick();
        })
        .catch((err: Error) => {
          console.error(err);
          alert(err.message);
        });
      }
      
    }

    function onCancelButtonClick() {
      props.setProjectToEdit(props.generateEmptyProjectObject());
      props.setEditMode(false);
      props.setEditModeOperation(OperationEnum.NONE);
    }

    // TODO: Duplicated - put it to shared
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
            /> HRK
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
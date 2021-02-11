import { OperationEnum } from '@/models/edit-mode-operations.enum';
import { IProject } from '@/models/projects.interface';
import { deleteProjects, getAllProjects } from '@/services/project.service';
import { generateEmptyProjectObject, mapDropdownOptionsToIProjects, mapIProjectsToDropdownOptions } from '@/utils/utils';
import React, { useState } from 'react';
import MultiSelect from "react-multi-select-component";
import { Option } from "react-multi-select-component/dist/lib/interfaces";
import InvoicesTableComponent from '../invoices-table/invoices-table';
import ProjectDetailsBoxComponent from '../shared/project-details-box/project-details-box';

export default function ProjectContainerComponent() {

  const [editMode, setEditMode] = useState(false);
  const [editModeOperation, setEditModeOperation] = useState(OperationEnum.NONE);
  
  const [allProjects, setAllProjects] = useState([] as IProject[]);
  const [allOptions, setAllOptions] = useState([] as Option[]);
 
  const [selectedOptions, setSelectedOptions] = useState([] as Option[]);
  const [projectToEdit, setProjectToEdit] = useState(generateEmptyProjectObject());

  React.useEffect(() => {
    getAllProjects()
    .then((projects: IProject[]) => {
      setAllProjects(projects);
      setAllOptions(mapIProjectsToDropdownOptions(projects));
    });
  }, []);

  function onAddButtonClick() {
    setEditMode(true);
    setEditModeOperation(OperationEnum.INSERT);
    setProjectToEdit(generateEmptyProjectObject());
  }

  function onEditButtonClick() {
    setEditMode(true);
    setEditModeOperation(OperationEnum.UPDATE);
    setProjectToEdit(getSelectedProjects()[0]);
  }

  function onDeleteButtonClick() {
    deleteProjects(getSelectedProjects());
  }

  function getSelectedProjects(): IProject[] {
    return mapDropdownOptionsToIProjects(allProjects, selectedOptions)
  }
  
  return (
    <div>
      <MultiSelect 
        labelledBy={"Select"}
        options={allOptions}
        value={selectedOptions}
        disabled={editMode}
        // isLoading={true} // TODO implement for fetching and actions
        onChange={setSelectedOptions} />
        
      <button onClick={onAddButtonClick}>Dodaj novi projekt</button>
      {selectedOptions.length === 1 && <button onClick={onEditButtonClick}>Uredi</button>}
      {selectedOptions.length > 0 && <button onClick={onDeleteButtonClick}>Obrisi oznaceno</button>}

      {selectedOptions.length > 0 
        && <ProjectDetailsBoxComponent
          editMode={editMode}
          setEditMode={setEditMode}
          editModeOperation={editModeOperation}
          setEditModeOperation={setEditModeOperation}
          selectedOptions={selectedOptions}
          setSelectedOptions={setSelectedOptions}
          allProjects={allProjects}
          projectToEdit={projectToEdit}
          setProjectToEdit={setProjectToEdit}
          getSelectedProjects={getSelectedProjects}
        />}
      <InvoicesTableComponent />
    </div>
  );
}
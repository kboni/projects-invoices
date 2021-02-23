import { OperationEnum } from '@/models/edit-mode-operations.enum';
import { IProject } from '@/models/projects.interface';
import { deleteProjects, getAllProjects } from '@/services/project.service';
import { mapDropdownOptionsToIProjects, mapIProjectsToDropdownOptions } from '@/utils/utils';
import React, { useState } from 'react';
import { confirmAlert } from 'react-confirm-alert';
import MultiSelect from "react-multi-select-component";
import { Option } from "react-multi-select-component/dist/lib/interfaces";
import InvoicesTableComponent from '../invoices-table/invoices-table';
import ProjectDetailsBoxComponent from '../shared/project-details-box/project-details-box';
import 'react-confirm-alert/src/react-confirm-alert.css';
import { TabsEnum } from '@/models/tabs.enum';
import { deleteSections, getAllSections } from '@/services/section.service';

export default function ProjectContainerComponent(props: {
  tabMode: TabsEnum
}) {

  const [editMode, setEditMode] = useState(false);
  const [editModeOperation, setEditModeOperation] = useState(OperationEnum.NONE);
  
  const [allProjects, setAllProjects] = useState([] as IProject[]);
  const [allOptions, setAllOptions] = useState([] as Option[]);
 
  const [selectedOptions, setSelectedOptions] = useState([] as Option[]);
  const [projectToEdit, setProjectToEdit] = useState(generateEmptyProjectObject());

  const [showInvoices, setShowInvoices] = useState(false);

  React.useEffect(() => {
    loadAllProjects()
  }, []);

  function generateEmptyProjectObject(): IProject {
    return { 
      uid: '',
      name: '',
      cost: 0,
      description: ''
    }
  }

  function loadAllProjects() {
    (props.tabMode === TabsEnum.SECTIONS ? getAllSections() : getAllProjects())
    .then((projects: IProject[]) => {
      setAllProjects(projects);
      setAllOptions(mapIProjectsToDropdownOptions(projects));
    });
  }

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

  // TODO: Duplicated - put it to shared
  function onDeleteButtonClick() {
    confirmAlert({
      title: 'Confirm to submit',
      message: 'Are you sure you want to delete the selected project(s)?',
      buttons: [
        {
          label: 'Yes',
          onClick: () => {
            console.log("Delete");
            (props.tabMode === TabsEnum.SECTIONS ? deleteSections(getSelectedProjects()) : deleteProjects(getSelectedProjects()))
            .then((arrayOfDeletedRowNumbers: number[]) => {
              // TODO: if arrayOfDeletedRowNumbers === [0] then it's an error because nothing got deleted
              console.log(arrayOfDeletedRowNumbers);
              loadAllProjects();
              setSelectedOptions([]);
            })
            .catch((err: Error) => {
              console.error(err);
              alert(err.message);
            });
          }
        },
        {
          label: 'No',
          onClick: () => {}
        }
      ]
    });
  }

  function getSelectedProjects(): IProject[] {
    return mapDropdownOptionsToIProjects(allProjects, selectedOptions)
  }
  
  return (
    <div>
      <div className="row">
        <div className="column">
          <div className="button-container">
            <button onClick={onAddButtonClick}>Dodaj novi projekt</button>
            <button disabled={selectedOptions.length !== 1} onClick={onEditButtonClick}>Uredi</button>
            <button disabled={selectedOptions.length < 1} onClick={onDeleteButtonClick}>Obrisi oznaceno</button>
            {props.tabMode === TabsEnum.PROJECTS &&
              <div>
                <br /><button disabled={selectedOptions.length < 1} onClick={() => setShowInvoices((prevState: boolean) => !prevState)}>Prikazi racune</button>
              </div>
            }
          </div>
          <MultiSelect 
            labelledBy={"Select"}
            options={allOptions}
            value={selectedOptions}
            disabled={editMode}
            // isLoading={true} // TODO implement for fetching and actions
            onChange={(options: Option[]) => {setSelectedOptions(options); props.tabMode === TabsEnum.PROJECTS && setShowInvoices(false);}} />
        </div>
        <div className="column">
          {(selectedOptions.length > 0 || editModeOperation === OperationEnum.INSERT)
          && <ProjectDetailsBoxComponent
            editMode={editMode}
            setEditMode={setEditMode}
            editModeOperation={editModeOperation}
            setEditModeOperation={setEditModeOperation}
            projectToEdit={projectToEdit}
            setProjectToEdit={setProjectToEdit}
            getSelectedProjects={getSelectedProjects}
            loadAllProjects={loadAllProjects}
            setSelectedOptions={setSelectedOptions}
            tabMode={props.tabMode}
            generateEmptyProjectObject={generateEmptyProjectObject}
          />}
        </div>
      </div>
      {props.tabMode === TabsEnum.PROJECTS && showInvoices &&
         <InvoicesTableComponent
            selectedProjects={getSelectedProjects()}
            showInvoices={showInvoices}
          />}
    </div>
  );
}
import { DBTableName } from '@reactapp/models/database-table.enum';
import { OperationEnum } from '@reactapp/models/edit-mode-operations.enum';
import { IProject } from '@reactapp/models/projects.interface';
import { deleteProjects, getAllProjects } from '@reactapp/services/project.service';
import { mapDropdownOptionsToIProjects, mapIProjectsToDropdownOptions } from '@reactapp/utils/utils';
import React, { useState } from 'react';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import MultiSelect from "react-multi-select-component";
import { Option } from "react-multi-select-component/dist/lib/interfaces";
import InvoicesTableComponent from '../invoices-table/invoices-table';
import ProjectDetailsBoxComponent from '../project-details-box/project-details-box';

export default function ProjectContainerComponent(props: {
  tabDBProjectTableName: DBTableName,
  tabDBProjectInvoiceTableName: DBTableName
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
    getAllProjects(props.tabDBProjectTableName)
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
      title: 'Potvrda brisanja',
      message: 'Jeste li sigurni da želite obrisati označeno?',
      buttons: [
        {
          label: 'Da',
          onClick: () => {
            console.log("Delete");
            deleteProjects(getSelectedProjects(), props.tabDBProjectTableName)
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
    <div className="inner-tabcontent">
      <div className="row">
        <div className="column">
          <div className="button-container">
            <button onClick={onAddButtonClick}>Dodaj novi</button>
            <button disabled={selectedOptions.length !== 1} onClick={onEditButtonClick}>Uredi</button>
            <button disabled={selectedOptions.length < 1} onClick={onDeleteButtonClick}>Obriši označeno</button>
            <br />
            <button disabled={selectedOptions.length < 1} onClick={() => setShowInvoices((prevState: boolean) => !prevState)}>Prikaži račune</button>
          </div>
          <MultiSelect 
            labelledBy={"Select"}
            options={allOptions}
            value={selectedOptions}
            disabled={editMode}
            overrideStrings={{
              "selectSomeItems": "Označi...",
              "allItemsAreSelected": "Svi su označeni",
              "selectAll": "Označi sve",
              "search": "Traži",
              "clearSearch": "Isprazni tražilicu"
            }}
            // isLoading={true} // TODO implement for fetching and actions
            onChange={(options: Option[]) => {setSelectedOptions(options); setShowInvoices(false);}} />
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
            tabDBProjectTableName={props.tabDBProjectTableName}
            generateEmptyProjectObject={generateEmptyProjectObject}
          />}
        </div>
      </div>
      {showInvoices &&
         <InvoicesTableComponent
            selectedProjects={getSelectedProjects()}
            showInvoices={showInvoices}
            tabDBProjectInvoiceTableName={props.tabDBProjectInvoiceTableName}
          />}
    </div>
  );
}
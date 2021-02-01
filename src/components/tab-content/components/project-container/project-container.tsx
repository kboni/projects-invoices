import { IProject } from '@/models/projects.interface';
import { getAllProjects } from '@/services/project.service';
import { selectedProjectsState } from '@/state/projects.state';
import { mapDropdownOptionsToIProjects, mapIProjectsToDropdownOptions } from '@/utils/utils';
import { useState } from '@hookstate/core';
import React from 'react';
import MultiSelect from "react-multi-select-component";
import { Option } from "react-multi-select-component/dist/lib/interfaces";
import ProjectDetailsBoxComponent from '../shared/project-details-box/project-details-box';

export default function ProjectContainerComponent() {

  const selectedProjects = useState(selectedProjectsState);
  const selectedOptions = mapIProjectsToDropdownOptions(selectedProjects.get());
  
  // TODO:  Make it async
  const allProjects = getAllProjects();
  const allOptions: Option[] = mapIProjectsToDropdownOptions(allProjects);

  function onChange(options: Option[]): void {
    selectedProjects.set(mapDropdownOptionsToIProjects(allProjects, options))
  }

  function showAddButton() {
    return (
      <button>Dodaj</button>
    )
  }

  function showEditButton() {
    if (selectedProjects.get().length === 1) {
      return (
        <button>Uredi</button>
      )
    }
  }

  function showDeleteButton() {
    if (selectedProjects.get().length > 0) {
      return (
        <button>Obrisi oznaceno</button>
      )
    }
  }
  
  function showProjectDetailsBox() {
    if (selectedProjects.get().length > 0) {
      return (
        <ProjectDetailsBoxComponent selectedProjects={selectedProjects.get()}/>
      )
    }
  }
  
  return (
    <div>
      <MultiSelect 
        labelledBy={"Select"}
        options={allOptions}
        value={selectedOptions}
        onChange={onChange} />
      {showAddButton()}
      {showEditButton()}
      {showDeleteButton()}

      {showProjectDetailsBox()}
    </div>
  );
}
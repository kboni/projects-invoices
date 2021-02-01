import { IProjectDetailsProps } from '@/models/projects.interface';
import React from 'react';
import '../../../../../../assets/style/project-details-box.css';

export default function ProjectDetailsBoxComponent(props: IProjectDetailsProps) {
  const selectedProjects = props.selectedProjects;
  const editMode = props.editMode;

  function showDetails() {
    if (selectedProjects.length === 1) {
      return (
        <p>
          <span>Naziv: {selectedProjects[0].name}</span><br/>
          <span>Iznos: {selectedProjects[0].amount} HRK</span><br/>
          <span>Opis: {selectedProjects[0].description}</span>
        </p>
      )
    }
    let totalAmout = 0;
    for (const project of selectedProjects) {
      totalAmout += project.amount;
    }
    return (
      <p>
        <span>Ukupan iznos oznacenih: {totalAmout} HRK</span><br/>
      </p>
    )
  }

  function showAndEditDetails() {
  return (
      <p>
        <span>Naziv: <input type="text" name="projectName" value={selectedProjects[0].name}/></span><br/>
        <span>Iznos: <input type="text" name="projectAmount" value={selectedProjects[0].amount}/> HRK</span><br/>
        <span>Opis: <textarea name="projectDescription">{selectedProjects[0].description}</textarea></span>
      </p>
    )
  }

  return (
    <div className="project-details-box">
      <p>
        <span>Detalji projekta:</span>
      </p>
      {editMode ? showAndEditDetails() : showDetails()}
    </div>
  );
}
import { IProject } from '@/models/projects.interface';
import React from 'react';

interface IProjectDetailsProps {
  selectedProjects: IProject[];
}

export default function ProjectDetailsBoxComponent(props: IProjectDetailsProps) {
  const selectedProjects = props.selectedProjects;

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

  return (
    <div style={{border: '1px solid', color: 'cornflowerblue', marginTop: '10px', padding: '10px'}}>
      <p>
        <span>Detalji projekta:</span>
      </p>
      {showDetails()}
    </div>
  );
}
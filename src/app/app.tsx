import React from 'react';

const App = () => {
  return (
    <div className="app">
      <div>
            <span>Ukupan iznos: 1,500,000.00 HRK</span>
        </div>
        <div className="tab">
            <button className="tablinks">Projekti</button>
            <button className="tablinks">Sekcije</button>
            <button className="tablinks">Oznake</button>
          </div>
        <section className="tabcontent" id="projectstab">
            <div>
                <select name="projects" id="projectsSelector">
                    <option value="projekt1">Projekt 1</option>
                    <option value="projekt1">Projekt 2</option>
                    <option value="projekt1">Projekt 3</option>
                </select>
                <button>Dodaj</button>
                <button>Uredi</button>
                <button>Obrisi oznaceno</button>
            </div>
            <div>
                <span>Detalji projekta:</span><br />
                <span>Naziv: <span id="projectname">Projekt 1</span></span><br />
                <span>Iznos: <span id="projektvalue">500,000.00 HRK</span></span><br />
            </div>
        </section>
        <section className="tabcontent" id="sectionstab">
            <div>
                <select name="sections" id="sectionSelector">
                    <option value="sekcija1">Sekcija 1</option>
                    <option value="sekcija2">Sekcija 2</option>
                    <option value="sekcija3">Sekcija 3</option>
                </select>
                <button>Dodaj</button>
                <button>Uredi</button>
                <button>Obrisi oznaceno</button>
            </div>
            <div>
                <span>Detalji sekcije:</span><br />
                <span>Naziv: <span id="projectname">Projekt 1</span></span><br />
                <span>Iznos: <span id="projektvalue">500,000.00 HRK</span></span><br />
            </div>
        </section>
        <section className="tabcontent" id="labelstab">
            <div>
                labels
            </div>
        </section>
    </div>
  );
}

export default App;
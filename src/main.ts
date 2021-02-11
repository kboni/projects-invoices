import { app, BrowserWindow, ipcMain } from 'electron';
import isDev from 'electron-is-dev'; // New Import
import Knex from 'knex';
import path from 'path';
import { IProject } from './models/projects.interface';
import { generateUid } from './utils/utils';
// import { dialog } from 'electron';

function createWindow(): void {  

  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    show: false
  });

  // const b = dialog.showOpenDialogSync(mainWindow, { properties: ['openFile'] });

  // console.log(b)
  // TODO: 
	const knex = Knex({
		client: "sqlite3",
		connection: {
			// filename: b ? b[0] : path.join(__dirname, 'database.sqlite')
			filename: path.join(__dirname, '../db/database.sqlite')
		}
	});

  console.log(isDev);
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:9000'
      : `file://${path.join(__dirname, 'index.html')}` // OR app.getAppPath()
  );
  mainWindow.once("ready-to-show", () => { mainWindow.show() })

  mainWindow.on('closed', () => app.quit());

  ipcMain.handle('getAllProjects', function(event): Promise<IProject[]> {
    return knex
      .select('uid', 'name', 'cost', 'description')
      .from("Project")
  });

  ipcMain.handle('insertNewProject', function(event, project: IProject): Promise<number[]>{
    project.uid = project.uid ? project.uid : generateUid();
    return knex('Project')
      .insert({
        uid: project.uid,
        name: project.name,
        cost: project.cost,
        description: project.description
      })
      .onConflict('uid')
      .merge({
        uid: generateUid()
      })
  });

  ipcMain.handle('updateProject', function(event, project: IProject): Promise<number>{
    return knex('Project')
      .where('uid', project.uid)
      .update({
        name: project.name,
        cost: project.cost,
        description: project.description
      });
  });

  ipcMain.handle('deleteProjects', function(event, projects: IProject[]): Promise<number[]> {
    const promises = [];

    for (let project of projects) {
      promises.push(knex('Project')
        .where('uid', project.uid)
        .del());
    }
    return Promise.all(promises);
  });
  
}

app.on('ready', createWindow);
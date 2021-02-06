import { app, BrowserWindow, ipcMain } from 'electron';
import isDev from 'electron-is-dev'; // New Import
import Knex from 'knex';
import path from 'path';

function createWindow(): void {
  // TODO: 
	const knex = Knex({
		client: "sqlite3",
		connection: {
			filename: path.join(__dirname, 'database.sqlite')
		}
	});

  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    show: false
  });
  console.log(isDev);
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:9000'
      : `file://${app.getAppPath()}/index.html`,
  );
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  mainWindow.once("ready-to-show", () => { mainWindow.show() })

  // TODO:
  ipcMain.on("mainWindowLoaded", function () {
		let result = knex.select("name").from("Project")
		result.then(function(rows: any){
			mainWindow.webContents.send("resultSent", rows);
		})
	});
}

app.on('ready', createWindow);
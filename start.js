require('dotenv').config();
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
const server = require('./server');
const {app, BrowserWindow, ipcMain} = require('electron');
const path = require('path');
const remoteMain = require('@electron/remote/main');
const ElectronStore = require('electron-store');
ElectronStore.initRenderer();

remoteMain.initialize();

// Retrieve the app version
const appVersion = app.getVersion();

// Set the feed URL for updates
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'MontherTuwati',
  repo: 'Zeead-POS',
  token: process.env.GITHUB_TOKEN,
  url: `https://github.com/MontherTuwati/Zeead-POS/releases/tag/v${appVersion}`,
});

autoUpdater.checkForUpdatesAndNotify();

const setupEvents = require('./installers/setupEvents')
 if (setupEvents.handleSquirrelEvent()) {
    return;
 }

// Set the log file location
log.transports.file.file = `${app.getPath('userData')}/StorePOS.log`;
log.transports.file.level = 'info'; // or 'debug', 'warn', 'error', etc.
log.transports.file.format = '{h}:{i}:{s} {level} {text}';
log.transports.console.level = false; // Disable console logging
log.catchErrors();
log.info('App started');


const contextMenu = require('electron-context-menu');

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    width: 1920,
    height: 1080,
    frame: false,
    minWidth: 1280,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  remoteMain.enable(mainWindow.webContents);

  mainWindow.maximize();
  mainWindow.show();

  mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}


app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})



ipcMain.on('app-quit', (evt, arg) => {
  app.quit()
})

ipcMain.on('app-restart', (evt, arg) => {
  app.relaunch();
  app.exit(0);
});


ipcMain.on('app-reload', (event, arg) => {
  mainWindow.reload();
});



contextMenu({
  prepend: (params, browserWindow) => [
     
      {label: 'DevTools',
       click(item, focusedWindow){
        focusedWindow.toggleDevTools();
      }
    },
     { 
      label: "Reload", 
        click() {
          mainWindow.reload();
      } 
    // },
    // {  label: 'Quit',  click:  function(){
    //    mainWindow.destroy();
    //     mainWindow.quit();
    // } 
  }  
  ],

});

 

 
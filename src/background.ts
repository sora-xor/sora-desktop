'use strict'

/* global __static */
import {
  app,
  protocol,
  BrowserWindow,
  dialog,
  Menu,
  ipcMain
} from 'electron'
import path from 'path'
import {
  createProtocol,
  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'
import UpdateHandler from './electron/update'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow: BrowserWindow | null
let updateWindow: BrowserWindow | null

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{
  scheme: 'app',
  privileges: {
    secure: true,
    standard: true
  }
}])

function createMainWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1250,
    height: 800,
    minWidth: 1250,
    minHeight: 800,
    show: false,
    icon: path.join(__static, 'icon.png'),
    title: 'Sora Desktop',
    webPreferences: {
      nodeIntegration: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
    if (!process.env.IS_TEST) mainWindow.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    mainWindow.loadURL('app://./index.html')
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  addEditMenu(mainWindow)
}

function createUpdateWindow () {
  updateWindow = new BrowserWindow({
    width: 300,
    height: 300,
    frame: false,
    center: true,
    resizable: false,
    title: 'Sora Desktop',
    webPreferences: {
      nodeIntegration: true
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    updateWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string + 'update')
    if (!process.env.IS_TEST) updateWindow.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    updateWindow.loadURL('app://./update.html')
  }

  updateWindow.on('closed', () => {
    updateWindow = null
  })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createUpdateWindow()
    createMainWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    try {
      await installVueDevtools()
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createUpdateWindow()
  createMainWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

function addEditMenu (window) {
  const buildVer = process.env.SORA_PACKAGE_VERSION
  const fullVer = process.env.SORA_COMMIT_HASH
  const shortVer = process.env.SORA_COMMIT_HASH_SHORT

  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Sora Desktop',
      submenu: [
        {
          label: 'Version',
          click () {
            dialog.showMessageBox({
              type: 'info',
              title: 'Version',
              message: `
                Build version: ${buildVer}
                Short version: ${shortVer}
                Application version: ${fullVer}
              `
            })
          }
        },
        { type: 'separator' },
        {
          role: 'quit',
          label: 'Quit'
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
      ]
    }
  ]

  const appMenu = Menu.buildFromTemplate(menuTemplate)

  Menu.setApplicationMenu(appMenu)
}

ipcMain.on('UPDATE_CHECK', async (event) => {
  if (mainWindow instanceof BrowserWindow) {
    const handler = new UpdateHandler(mainWindow)
    // TODO: Finish the auto-update after the nexus is ready.
    // const result = await handler.checkUpdates()
    event.sender.send('UPDATE_DONE')
  }
})

ipcMain.on('START_APP', () => {
  if (updateWindow instanceof BrowserWindow) {
    updateWindow.close()
  }
  if (mainWindow instanceof BrowserWindow) {
    mainWindow.show()
  }
})

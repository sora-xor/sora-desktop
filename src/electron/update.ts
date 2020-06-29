import { autoUpdater } from 'electron-updater'
import { BrowserWindow } from 'electron'

export default class UpdateHandler {
  window: BrowserWindow
  constructor (win: BrowserWindow) {
    this.window = win
    this._createEvents()
  }

  checkUpdates () {
    return autoUpdater.checkForUpdatesAndNotify()
  }

  private _updateStatus (msg: string) {
    this.window.webContents.send('MESSAGE', msg)
  }

  private _createEvents () {
    autoUpdater.on('checking-for-update', () => {
      this._updateStatus('Checking for update...')
    })
    autoUpdater.on('update-available', info => {
      this._updateStatus('Update available.')
    })
    autoUpdater.on('update-not-available', info => {
      this._updateStatus('Update not available.')
    })
    autoUpdater.on('error', err => {
      this._updateStatus(`Error in auto-updater: ${err.toString()}`)
    })
    autoUpdater.on('download-progress', progressObj => {
      this._updateStatus(
        `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred} + '/' + ${progressObj.total} + )`
      )
    })
    autoUpdater.on('update-downloaded', () => {
      this._updateStatus('Update downloaded will install now')
    })
    autoUpdater.on('update-downloaded', () => {
      autoUpdater.quitAndInstall()
    })
  }
}

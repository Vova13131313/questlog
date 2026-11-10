const { app, BrowserWindow, globalShortcut, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;

ipcMain.handle('get-autostart', () => {
    return app.getLoginItemSettings().openAtLogin;
});

ipcMain.on('set-autostart', (event, enable) => {
    app.setLoginItemSettings({
        openAtLogin: enable
    });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    
    mainWindow.maximize();
    mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow();

    const shortcut = 'Alt+Q';
    const ret = globalShortcut.register(shortcut, () => {
        if (!mainWindow) return;

        if (mainWindow.isVisible()) {
            mainWindow.hide();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    if (!ret) {
        console.log('Hotkey registration failed');
    }

    tray = new Tray(path.join(__dirname, 'assets/icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open questlog', click: () => mainWindow.show() },
        { type: 'separator' },
        { label: 'Quit', click: () => app.quit() }
    ]);
    tray.setToolTip('Quest Log Overlay');
    tray.setContextMenu(contextMenu);
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

ipcMain.on('hide-window', () => {
    if (mainWindow) {
        mainWindow.hide();
    }
});
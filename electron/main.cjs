const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 960,
    minHeight: 640,
    title: 'Mochi Anki - Học Tiếng Anh Thông Minh',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows loading local file assets/audio smoothly
    },
    icon: path.join(__dirname, '../public/gojo.png'),
  });

  // Set clean browser User-Agent to prevent YouTube from blocking Electron embeds
  const cleanUserAgent = win.webContents.userAgent.replace(/Electron\/\S+\s?/, '');
  win.webContents.setUserAgent(cleanUserAgent);

  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Open external links in the default system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  // Modify headers for YouTube iframe embeds to prevent Error 150/153
  session.defaultSession.webRequest.onBeforeSendHeaders(
    {
      urls: [
        '*://*.youtube.com/*',
        '*://*.youtube-nocookie.com/*',
        '*://*.googlevideo.com/*',
      ],
    },
    (details, callback) => {
      details.requestHeaders['Referer'] = 'https://www.youtube.com/';
      details.requestHeaders['Origin'] = 'https://www.youtube.com';
      if (details.requestHeaders['User-Agent']) {
        details.requestHeaders['User-Agent'] = details.requestHeaders['User-Agent'].replace(/Electron\/\S+\s?/, '');
      }
      callback({ cancel: false, requestHeaders: details.requestHeaders });
    }
  );

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const { app, BrowserWindow, ipcMain, Menu } = require("electron");
const { execFile } = require("child_process");
const path = require("path");

const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL || "http://127.0.0.1:5173";
const PYTHON_TIMEOUT_MS = 15000;

function getWifiReaderPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "app.asar.unpacked", "electron", "wifi_reader.py");
  }

  return path.join(__dirname, "wifi_reader.py");
}

function executePython(command, args) {
  return new Promise((resolve, reject) => {
    execFile(
      command,
      args,
      {
        windowsHide: true,
        timeout: PYTHON_TIMEOUT_MS,
      },
      (error, stdout, stderr) => {
        if (stdout?.trim().startsWith("{")) {
          resolve(stdout);
          return;
        }

        if (error) {
          reject(new Error(stderr?.trim() || error.message));
          return;
        }

        resolve(stdout);
      },
    );
  });
}

async function readWifiSignal() {
  const scriptPath = getWifiReaderPath();
  const candidates =
    process.platform === "win32"
      ? [
          { command: "py", args: ["-3", scriptPath] },
          { command: "python", args: [scriptPath] },
          { command: "python3", args: [scriptPath] },
        ]
      : [
          { command: "python3", args: [scriptPath] },
          { command: "python", args: [scriptPath] },
        ];

  const errors = [];

  for (const candidate of candidates) {
    try {
      const output = await executePython(candidate.command, candidate.args);
      return JSON.parse(output);
    } catch (error) {
      errors.push(`${candidate.command}: ${error.message}`);
    }
  }

  throw new Error(`No se pudo ejecutar Python para leer la WiFi. ${errors.join(" | ")}`);
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  mainWindow.webContents.on("did-fail-load", (_, code, description) => {
    console.error(`Renderer failed to load (${code}): ${description}`);
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
    return;
  }

  mainWindow.loadURL(DEV_SERVER_URL).catch(() => {
    // Vite can still be finalizing boot; retry once after a short delay.
    setTimeout(() => {
      mainWindow.loadURL(DEV_SERVER_URL).catch((err) => {
        console.error("Failed to load dev server URL:", err);
      });
    }, 800);
  });
}

if (ipcMain && typeof ipcMain.handle === "function") {
  ipcMain.handle("app:ping", () => "pong");
  ipcMain.handle("wifi:current", () => readWifiSignal());
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Chrome yolu: CHROME ortam değişkeni ya da işletim sistemine göre bilinen konumlar.
import fs from 'fs'; import path from 'path';
const C = process.platform === 'win32'
  ? [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean).map(d => path.join(d, 'Google', 'Chrome', 'Application', 'chrome.exe'))
  : process.platform === 'darwin' ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
  : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
export const CHROME_DEFAULT = process.env.CHROME || C.find(p => fs.existsSync(p)) || C[0];

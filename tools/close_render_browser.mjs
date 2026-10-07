import {spawn} from 'node:child_process';
/* A completed encode must not wait indefinitely for Chrome's shutdown on Windows. */
export async function closeRenderBrowser(browser){
  const process=browser.process();let timer;
  const timeout=new Promise(resolve=>{timer=setTimeout(resolve,5000);});
  await Promise.race([browser.close().catch(()=>{}),timeout]);clearTimeout(timer);
  if(process&&process.exitCode===null){
    if(globalThis.process.platform==='win32')await new Promise(resolve=>{const killer=spawn('taskkill',['/PID',String(process.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});killer.on('error',resolve);killer.on('close',resolve);});
    else process.kill('SIGKILL');
    browser.disconnect();
  }
}

import { spawn } from 'child_process';

export async function execa(
  cmd: string,
  args: string[],
  options: { cwd: string; onData: (data: string) => void },
) {
  const child = spawn(cmd, args, {
    stdio: 'pipe',
    cwd: options.cwd,
  });
  return new Promise((resolve, reject) => {
    child.stdout?.on('data', (data) => {
      options.onData(data);
    });
    child.stderr?.on('data', (data) => {
      options.onData(data);
    });
    child.on('close', (code) => {
      resolve(code);
    });
    child.on('error', (error) => {
      reject(error);
    });
  });
}

import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const apiPort = await findAvailablePort();
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];

const server = spawn(npm, ['run', 'dev'], {
  cwd: path.join(root, 'server'),
  env: { ...process.env, PORT: String(apiPort) },
  stdio: 'inherit'
});
const client = spawn(npm, ['run', 'dev'], {
  cwd: path.join(root, 'client'),
  env: { ...process.env, API_PORT: String(apiPort) },
  stdio: 'inherit'
});
children.push(server, client);

console.log(`API selected port ${apiPort}`);

function shutdown() {
  children.forEach((child) => child.kill('SIGTERM'));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
server.on('exit', (code) => { if (code && code !== 143) client.kill('SIGTERM'); });

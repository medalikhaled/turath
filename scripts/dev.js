const { spawn } = require('child_process');

// Start Convex dev
const convex = spawn('npx', ['convex', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Start Next.js dev
const next = spawn('npx', ['next', 'dev', '--turbopack'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  convex.kill();
  next.kill();
  process.exit();
});

process.on('SIGTERM', () => {
  convex.kill();
  next.kill();
  process.exit();
});
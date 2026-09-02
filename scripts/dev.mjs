import { createServer } from 'vite';

async function start() {
  const server = await createServer({
    configFile: './vite.config.ts',
  });
  await server.listen(5174);
  server.printUrls();

  setInterval(() => {}, 60000);
}

start().catch(err => {
  console.error('Failed to start Vite dev server:', err);
  process.exit(1);
});

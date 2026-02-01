import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Store running preview servers
const runningServers = new Map<string, { port: number; process: any }>();
const BASE_PORT = 4000;

export async function POST(request: Request) {
  try {
    const { componentId, action } = await request.json();

    if (action === 'start') {
      // Check if already running
      if (runningServers.has(componentId)) {
        const server = runningServers.get(componentId)!;
        return NextResponse.json({
          success: true,
          port: server.port,
          url: `http://localhost:${server.port}`,
          status: 'running'
        });
      }

      const componentPath = path.join(
        process.cwd(),
        'src/app/partner/backwards/prototypes/fetch-model-and-req/_created-apps',
        componentId
      );

      // Check if component exists
      if (!fs.existsSync(componentPath)) {
        return NextResponse.json(
          { error: 'Component not found' },
          { status: 404 }
        );
      }

      // Find an available port
      const port = BASE_PORT + runningServers.size;

      // Check if package.json exists
      const packageJsonPath = path.join(componentPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        return NextResponse.json(
          { error: 'Component package.json not found' },
          { status: 400 }
        );
      }

      try {
        // Install dependencies if node_modules doesn't exist
        const nodeModulesPath = path.join(componentPath, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
          console.log(`[Preview] Installing dependencies for ${componentId}...`);
          await execAsync('bun install', { cwd: componentPath });
        }

        // Start the dev server in background
        console.log(`[Preview] Starting dev server for ${componentId} on port ${port}...`);
        const childProcess = exec(
          `PORT=${port} bun run dev -- --port ${port}`,
          {
            cwd: componentPath,
            env: { ...process.env, PORT: port.toString() }
          }
        );

        // Store the process
        runningServers.set(componentId, { port, process: childProcess });

        // Log output
        childProcess.stdout?.on('data', (data) => {
          console.log(`[Preview ${componentId}:${port}] ${data}`);
        });

        childProcess.stderr?.on('data', (data) => {
          console.error(`[Preview ${componentId}:${port} ERROR] ${data}`);
        });

        // Handle process exit
        childProcess.on('exit', (code) => {
          console.log(`[Preview] Server for ${componentId} exited with code ${code}`);
          runningServers.delete(componentId);
        });

        // Wait a bit for the server to start
        await new Promise(resolve => setTimeout(resolve, 3000));

        return NextResponse.json({
          success: true,
          port,
          url: `http://localhost:${port}`,
          status: 'starting',
          message: 'Dev server is starting. It may take a few moments to be ready.'
        });

      } catch (error: any) {
        console.error(`[Preview] Error starting server for ${componentId}:`, error);
        return NextResponse.json(
          { error: `Failed to start dev server: ${error.message}` },
          { status: 500 }
        );
      }
    }

    if (action === 'stop') {
      const server = runningServers.get(componentId);
      if (server) {
        server.process.kill();
        runningServers.delete(componentId);
        return NextResponse.json({
          success: true,
          message: 'Server stopped'
        });
      }
      return NextResponse.json({
        success: true,
        message: 'Server was not running'
      });
    }

    if (action === 'status') {
      const server = runningServers.get(componentId);
      if (server) {
        return NextResponse.json({
          success: true,
          status: 'running',
          port: server.port,
          url: `http://localhost:${server.port}`
        });
      }
      return NextResponse.json({
        success: true,
        status: 'stopped'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Preview API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // List all running servers
  const servers = Array.from(runningServers.entries()).map(([id, server]) => ({
    componentId: id,
    port: server.port,
    url: `http://localhost:${server.port}`,
    status: 'running'
  }));

  return NextResponse.json({ servers });
}

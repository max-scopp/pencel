import { discoverProjects, listProjects } from '../src/workspace';
import { mkdtemp, writeFileSync, rmSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';

describe('workspace discovery', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtemp(join(tmpdir(), 'pencil-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should discover projects in a workspace', () => {
    // Create a test workspace structure
    const rootPackageJson = {
      name: '@test/workspace',
      workspaces: ['packages/*'],
      private: true
    };
    
    const nxJson = {
      projects: {}
    };

    const cliPackageJson = {
      name: '@test/cli',
      version: '1.0.0',
      private: true,
      nx: {
        projectType: 'application'
      }
    };

    const corePackageJson = {
      name: '@test/core',
      version: '1.0.0',
      nx: {
        projectType: 'library'
      }
    };

    // Write test files
    writeFileSync(join(testDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2));
    writeFileSync(join(testDir, 'nx.json'), JSON.stringify(nxJson, null, 2));
    
    const packagesDir = join(testDir, 'packages');
    mkdirSync(packagesDir, { recursive: true });
    
    const cliDir = join(packagesDir, 'cli');
    mkdirSync(cliDir, { recursive: true });
    writeFileSync(join(cliDir, 'package.json'), JSON.stringify(cliPackageJson, null, 2));
    
    const coreDir = join(packagesDir, 'core');
    mkdirSync(coreDir, { recursive: true });
    writeFileSync(join(coreDir, 'package.json'), JSON.stringify(corePackageJson, null, 2));

    // Test discovery
    const workspaceInfo = discoverProjects(testDir);

    expect(workspaceInfo.root).toBe(testDir);
    expect(workspaceInfo.projects).toHaveLength(2);
    
    const cliProject = workspaceInfo.projects.find(p => p.name === '@test/cli');
    expect(cliProject).toBeDefined();
    expect(cliProject?.type).toBe('application');
    expect(cliProject?.version).toBe('1.0.0');
    
    const coreProject = workspaceInfo.projects.find(p => p.name === '@test/core');
    expect(coreProject).toBeDefined();
    expect(coreProject?.type).toBe('library');
    expect(coreProject?.version).toBe('1.0.0');
  });
});
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';

export interface Project {
  name: string;
  path: string;
  type: 'application' | 'library';
  version?: string;
  dependencies?: Record<string, string>;
}

export interface WorkspaceInfo {
  root: string;
  projects: Project[];
}

/**
 * Discovers all projects in the workspace by reading nx.json and package.json files
 */
export function discoverProjects(workspaceRoot: string = process.cwd()): WorkspaceInfo {
  const projects: Project[] = [];
  
  // Read root package.json
  const rootPackagePath = resolve(workspaceRoot, 'package.json');
  if (!existsSync(rootPackagePath)) {
    throw new Error(`No package.json found at workspace root: ${workspaceRoot}`);
  }
  
  const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf-8'));
  
  // Read nx.json if it exists
  const nxConfigPath = resolve(workspaceRoot, 'nx.json');
  const hasNxConfig = existsSync(nxConfigPath);
  
  // If this is an nx workspace, we can use workspace information
  if (hasNxConfig && rootPackage.workspaces) {
    // Find all packages based on workspace patterns
    for (const workspacePattern of rootPackage.workspaces) {
      const packagesDir = resolve(workspaceRoot, workspacePattern.replace('/**', '').replace('/*', ''));
      
      if (existsSync(packagesDir) && statSync(packagesDir).isDirectory()) {
        const packageDirs = readdirSync(packagesDir).filter(dir => {
          const dirPath = join(packagesDir, dir);
          return statSync(dirPath).isDirectory() && existsSync(join(dirPath, 'package.json'));
        });
        
        for (const packageDir of packageDirs) {
          const packagePath = join(packagesDir, packageDir);
          const packageJsonPath = join(packagePath, 'package.json');
          
          try {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const relativePackagePath = packagePath.replace(workspaceRoot + '/', '');
            
            // Determine project type from nx config if available
            let projectType: 'application' | 'library' = 'library';
            if (packageJson.nx?.projectType) {
              projectType = packageJson.nx.projectType;
            } else if (packageJson.private === false || packageJson.bin) {
              projectType = 'application';
            }
            
            projects.push({
              name: packageJson.name || packageDir,
              path: relativePackagePath,
              type: projectType,
              version: packageJson.version,
              dependencies: packageJson.dependencies
            });
          } catch (error) {
            console.warn(`Warning: Could not parse package.json at ${packageJsonPath}`);
          }
        }
      }
    }
  } else {
    // Single package project
    projects.push({
      name: rootPackage.name || 'root',
      path: '.',
      type: rootPackage.private === false ? 'application' : 'library',
      version: rootPackage.version,
      dependencies: rootPackage.dependencies
    });
  }
  
  return {
    root: workspaceRoot,
    projects
  };
}

/**
 * Lists all projects in a formatted way
 */
export function listProjects(workspaceInfo: WorkspaceInfo): void {
  console.log(`\nWorkspace: ${workspaceInfo.root}`);
  console.log(`Found ${workspaceInfo.projects.length} project(s):\n`);
  
  for (const project of workspaceInfo.projects) {
    console.log(`📦 ${project.name}`);
    console.log(`   Type: ${project.type}`);
    console.log(`   Path: ${project.path}`);
    if (project.version) {
      console.log(`   Version: ${project.version}`);
    }
    if (project.dependencies && Object.keys(project.dependencies).length > 0) {
      console.log(`   Dependencies: ${Object.keys(project.dependencies).length} packages`);
    }
    console.log('');
  }
}
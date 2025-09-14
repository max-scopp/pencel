import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { mkdirSync } from 'fs';

export interface FeatureConfig {
  name: string;
  enabled: boolean;
  description?: string;
  clientTypes?: string[];
}

export interface ProjectFeatures {
  projectName: string;
  features: FeatureConfig[];
}

export interface WorkspaceFeatures {
  version: string;
  projects: ProjectFeatures[];
}

/**
 * Enables a feature for all clients in the workspace
 */
export function enableFeatureForAllClients(
  workspaceRoot: string,
  featureName: string,
  description?: string,
  clientTypes: string[] = ['all'],
  projectNames?: string[]
): void {
  const configPath = resolve(workspaceRoot, '.pencil', 'features.json');
  
  // Ensure the .pencil directory exists
  const configDir = dirname(configPath);
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
  }
  
  // Read existing config or create new one
  let workspaceFeatures: WorkspaceFeatures;
  if (existsSync(configPath)) {
    try {
      workspaceFeatures = JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch {
      workspaceFeatures = { version: '1.0.0', projects: [] };
    }
  } else {
    workspaceFeatures = { version: '1.0.0', projects: [] };
  }
  
  // Use provided project names or discover them
  if (!projectNames) {
    console.error('Project names must be provided. Use the CLI commands which will discover them automatically.');
    return;
  }
  
  // Enable feature for each project
  for (const projectName of projectNames) {
    let projectFeatures = workspaceFeatures.projects.find(p => p.projectName === projectName);
    
    if (!projectFeatures) {
      projectFeatures = {
        projectName,
        features: []
      };
      workspaceFeatures.projects.push(projectFeatures);
    }
    
    // Check if feature already exists
    const existingFeature = projectFeatures.features.find(f => f.name === featureName);
    
    if (existingFeature) {
      existingFeature.enabled = true;
      existingFeature.description = description;
      existingFeature.clientTypes = clientTypes;
    } else {
      projectFeatures.features.push({
        name: featureName,
        enabled: true,
        description,
        clientTypes
      });
    }
  }
  
  // Write updated config
  writeFileSync(configPath, JSON.stringify(workspaceFeatures, null, 2));
  
  console.log(`✅ Enabled "${featureName}" for all clients in ${projectNames.length} projects`);
  console.log(`📝 Configuration saved to: ${configPath}`);
}

/**
 * Lists all enabled features across the workspace
 */
export function listFeatures(workspaceRoot: string): void {
  const configPath = resolve(workspaceRoot, '.pencil', 'features.json');
  
  if (!existsSync(configPath)) {
    console.log('No features configuration found. Run enable commands first.');
    return;
  }
  
  try {
    const workspaceFeatures: WorkspaceFeatures = JSON.parse(readFileSync(configPath, 'utf-8'));
    
    console.log('\n🚀 Feature Status Across Workspace:\n');
    
    for (const projectFeatures of workspaceFeatures.projects) {
      console.log(`📦 ${projectFeatures.projectName}`);
      
      if (projectFeatures.features.length === 0) {
        console.log('   No features configured');
      } else {
        for (const feature of projectFeatures.features) {
          const status = feature.enabled ? '✅' : '❌';
          console.log(`   ${status} ${feature.name}`);
          if (feature.description) {
            console.log(`      ${feature.description}`);
          }
          if (feature.clientTypes && feature.clientTypes.length > 0) {
            console.log(`      Client Types: ${feature.clientTypes.join(', ')}`);
          }
        }
      }
      console.log('');
    }
  } catch (error) {
    console.error(`Error reading features configuration: ${error}`);
  }
}

/**
 * Disables a feature for all clients in the workspace
 */
export function disableFeatureForAllClients(workspaceRoot: string, featureName: string): void {
  const configPath = resolve(workspaceRoot, '.pencil', 'features.json');
  
  if (!existsSync(configPath)) {
    console.log('No features configuration found.');
    return;
  }
  
  try {
    const workspaceFeatures: WorkspaceFeatures = JSON.parse(readFileSync(configPath, 'utf-8'));
    let updatedCount = 0;
    
    for (const projectFeatures of workspaceFeatures.projects) {
      const feature = projectFeatures.features.find(f => f.name === featureName);
      if (feature && feature.enabled) {
        feature.enabled = false;
        updatedCount++;
      }
    }
    
    writeFileSync(configPath, JSON.stringify(workspaceFeatures, null, 2));
    
    console.log(`❌ Disabled "${featureName}" for ${updatedCount} projects`);
    console.log(`📝 Configuration saved to: ${configPath}`);
  } catch (error) {
    console.error(`Error updating features configuration: ${error}`);
  }
}
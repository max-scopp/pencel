import { Biome, Distribution } from "@biomejs/js-api";

let biomeSingleton: Biome | null = null;

async function getBiome(): Promise<Biome> {
  if (!biomeSingleton) {
    biomeSingleton = await Biome.create({ distribution: Distribution.NODE });
  }
  return biomeSingleton;
}

/**
 *  Format code with Biome using the JavaScript API. filePath is used for language detection.
 */
export async function formatWithBiome(
  code: string,
  filePath: string,
  projectDir: string,
): Promise<string> {
  try {
    const biome = await getBiome();
    const { projectKey } = await biome.openProject(projectDir);
    const formatted = await biome.formatContent(projectKey, code, {
      filePath,
    });
    return formatted.content;
  } catch (error) {
    console.warn(
      `Warning: Biome formatting failed for ${filePath}:`,
      error instanceof Error ? error.message : error,
    );
    return code;
  }
}

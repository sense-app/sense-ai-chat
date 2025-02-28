import fs from 'node:fs';
import path from 'node:path';

export function writeToFile(data: string, filename: string) {
  try {
    const tmpDir = path.join(process.cwd(), 'tmp');
    // Ensure tmp directory exists
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    fs.writeFileSync(path.join(tmpDir, `${filename}.txt`), data, 'utf-8');
  } catch (error) {
    console.error('Error writing shopping prompt to file:', error);
  }
}

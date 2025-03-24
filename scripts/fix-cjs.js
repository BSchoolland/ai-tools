import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cjsDir = path.resolve(__dirname, '../dist/cjs');

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix local imports
  content = content.replace(/require\("\.\/([^"]+)\.js"\)/g, 'require("./$1.cjs")');
  
  // Fix parent directory imports
  content = content.replace(/require\("\.\.\/([^"]+)\.js"\)/g, 'require("../$1.cjs")');
  
  fs.writeFileSync(filePath, content);
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.cjs')) {
      console.log(`Processing ${fullPath}`);
      fixImports(fullPath);
    }
  }
}

processDirectory(cjsDir); 
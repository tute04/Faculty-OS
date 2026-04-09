const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
let replaced = 0;

function cleanDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      cleanDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const initialContent = content;
      
      content = content.replace(/console\.(log|error|warn)\([\s\S]*?\);?/g, '');
      
      if (content !== initialContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        replaced++;
        console.log('Cleaned:', file);
      }
    }
  });
}

cleanDir(srcDir);
console.log(`Cleaned ${replaced} files.`);

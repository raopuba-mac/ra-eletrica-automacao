import fs from 'fs';
import path from 'path';

const uiDir = path.join(process.cwd(), 'src/components/ui');
const files = fs.readdirSync(uiDir);

for (const file of files) {
  if (file.endsWith('.tsx')) {
    const filePath = path.join(uiDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/@\/lib\/utils/g, '../../lib/utils');
    content = content.replace(/@\/components\//g, '../../components/');
    fs.writeFileSync(filePath, content);
  }
}
console.log('Fixed imports in components UI');

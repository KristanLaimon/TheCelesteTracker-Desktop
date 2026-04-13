import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const files = walk(rootDir).filter(f => /\.(svelte|ts|js|css|html)$/.test(f));
const pattern = /text-\[var\((--[\w-]+)\)\]/g;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (pattern.test(content)) {
        const newContent = content.replace(pattern, 'text-($1)');
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated: ${path.relative(__dirname, file)}`);
    }
});

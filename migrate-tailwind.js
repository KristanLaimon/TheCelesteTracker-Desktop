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
// Matches (bg|text|border|etc...)-[var(--name)] optionally followed by /opacity
const pattern = /(bg|text|border|from|to|via|accent|outline|ring|fill|stroke)-\[var\((--[\w-]+)\)\](\/\d+)?/g;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (pattern.test(content)) {
        // $1: prefix, $2: variable name, $3: optional /opacity
        const newContent = content.replace(pattern, (match, prefix, variable, opacity) => {
            return `${prefix}-(${variable})${opacity || ''}`;
        });
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated: ${path.relative(__dirname, file)}`);
    }
});

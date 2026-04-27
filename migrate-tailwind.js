//@ts-nocheck
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "src");

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

const files = walk(rootDir).filter(f => /\.(svelte|ts|js|css|html|astro)$/.test(f));

// Patterns to migrate
const replacements = [
  // 1. [var(--name)] -> (--name)
  {
    pattern: /(bg|text|border|from|to|via|accent|outline|ring|fill|stroke)-\[var\((--[\w-]+)\)\](\/\d+)?/g,
    replace: (match, prefix, variable, opacity) => `${prefix}-(${variable})${opacity || ""}`,
  },
  // 2. bg-gradient-to-(r|l|t|b|tr|tl|br|bl) -> bg-linear-to-$1
  {
    pattern: /bg-gradient-to-(r|l|t|b|tr|tl|br|bl)/g,
    replace: "bg-linear-to-$1",
  },
  // 3. (prefix)-(--hub-name) -> (prefix)-hub-name
  {
    pattern: /(bg|text|border|from|to|via|accent|outline|ring|fill|stroke)-\((--hub-[\w-]+)\)(\/\d+)?/g,
    replace: (match, prefix, variable, opacity) => {
      const cleanName = variable.replace("--", "");
      return `${prefix}-${cleanName}${opacity || ""}`;
    },
  },
];

files.forEach(file => {
  let content = fs.readFileSync(file, "utf8");
  let changed = false;

  replacements.forEach(r => {
    if (r.pattern.test(content)) {
      content = content.replace(r.pattern, r.replace);
      changed = true;
    }
  });

  if (changed) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`Updated: ${path.relative(__dirname, file)}`);
  }
});

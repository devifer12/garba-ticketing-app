import { readFileSync } from 'fs';
import path from 'path';
import { sync } from 'glob';

// Function to extract class names from a file
const extractClassNames = (content) => {
  const classRegex = /className=["'`]([^"'`]+)["'`]/g;
  const matches = [...content.matchAll(classRegex)];
  return matches.flatMap(match => match[1].split(/\s+/));
};

// Function to extract Tailwind classes from a file
const extractTailwindClasses = (content) => {
  // Get all className attributes
  const classNames = extractClassNames(content);
  
  // Get classes from clsx or cn function calls
  const clsxRegex = /(clsx|cn)\(([^)]+)\)/g;
  const clsxMatches = [...content.matchAll(clsxRegex)];
  const clsxClasses = clsxMatches.flatMap(match => {
    const arg = match[2];
    // Extract string literals
    const stringRegex = /["'`]([^"'`]+)["'`]/g;
    const strings = [...arg.matchAll(stringRegex)];
    return strings.flatMap(s => s[1].split(/\s+/));
  });

  return [...new Set([...classNames, ...clsxClasses])];
};

// Main function to analyze CSS usage
const analyzeCSSUsage = async () => {
  // Get all JS/JSX files
  const files = sync('src/**/*.{js,jsx}');
  
  const allUsedClasses = new Set();
  const classUsageMap = new Map();

  files.forEach(file => {
    const content = readFileSync(file, 'utf8');
    const classes = extractTailwindClasses(content);
    
    classes.forEach(cls => {
      allUsedClasses.add(cls);
      if (!classUsageMap.has(cls)) {
        classUsageMap.set(cls, new Set());
      }
      classUsageMap.get(cls).add(file);
    });
  });

  // Output results
  console.log('CSS Usage Analysis:');
  console.log('-------------------');
  console.log(`Total unique classes used: ${allUsedClasses.size}`);
  
  // Show classes used only once (potential candidates for removal)
  console.log('\nClasses used in only one file:');
  classUsageMap.forEach((files, cls) => {
    if (files.size === 1) {
      console.log(`${cls}: ${Array.from(files)[0]}`);
    }
  });
};

analyzeCSSUsage();

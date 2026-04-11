const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!fullPath.includes('node_modules') && !fullPath.includes('.git') && !fullPath.includes('.next') && !fullPath.includes('build')) {
                results = results.concat(walk(fullPath));
            }
        } else {
            if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx') || fullPath.endsWith('.html') || fullPath.endsWith('.css' )) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk(process.cwd());
let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    
    // Replace indigo and purple with blue
    newContent = newContent.replace(/\bindigo-/g, 'blue-');
    newContent = newContent.replace(/\bpurple-/g, 'blue-');
    
    // Replace all rounded-* with nothing or rounded-none
    newContent = newContent.replace(/\brounded-(?:3xl|2xl|xl|lg|md|sm|full)\b/g, 'rounded-none');
    newContent = newContent.replace(/["']rounded["']/g, '"rounded-none"');
    newContent = newContent.replace(/\s+rounded\s+/g, ' rounded-none ');
    
    // Keep clean
    newContent = newContent.replace(/(rounded-none\s+)+/g, 'rounded-none ');

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        changedFiles++;
    }
});

console.log('Total files updated: ' + changedFiles);

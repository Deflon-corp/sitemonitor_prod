const fs = require('fs');
const path = require('path');

const componentsDir = 'd:/sitemonitor/Frontend/src/components';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Rename "Details" column to "Pages" in Sections if it doesn't already have Pages
  if (filePath.includes('Section') || filePath.includes('View') || filePath.includes('Drawer')) {
    // In variant === "page", replace "Details" with "Pages" for the table header
    // Actually, let's just find the <th...>Details</th> and replace with <th...>Pages</th> if it's the misspellings section table header
    if (filePath.endsWith('MisspellingsSection.jsx') || filePath.endsWith('DictionarySection.jsx') || filePath.endsWith('IgnoredSpellingsSection.jsx') || filePath.endsWith('PotentialMisspellingsSection.jsx')) {
      content = content.replace(/<th([^>]*)className="([^"]*)"([^>]*)>Details<\/th>/g, '<th$1className="$2"$3>Pages</th>');
    }
  }

  // 2. Remove "Language" columns
  // For JSX components:
  content = content.replace(/<th([^>]*)>Language\s*<\/th>/g, '');
  content = content.replace(/\{showLanguage && <th([^>]*)>Language\s*<\/th>\}/g, '');
  content = content.replace(/\{showLanguage && <td([^>]*)>\{row\.language\}<\/td>\}/g, '');
  
  // For React.createElement:
  content = content.replace(/,\s*React\.createElement\('th',\s*{([^}]*)},\s*"Language"\s*\)/g, '');
  content = content.replace(/,\s*React\.createElement\('td',\s*{([^}]*)},\s*p\.language\s*\)/g, '');
  content = content.replace(/,\s*React\.createElement\('td',\s*{([^}]*)},\s*row\.language\s*\)/g, '');
  content = content.replace(/,\s*React\.createElement\('td',\s*{([^}]*)},\s*issue\.language\s*\)/g, '');
  
  // Remove from dt/dd
  content = content.replace(/,\s*React\.createElement\('dt',\s*{([^}]*)},\s*"Language"\s*\)\s*,\s*React\.createElement\('dd',\s*{([^}]*)},\s*issue\.language\s*\)/g, '');

  // 3. Remove "Views" columns
  // For React.createElement:
  content = content.replace(/,\s*React\.createElement\('th',\s*{([^}]*)},\s*"Views"(\s*,\s*React\.createElement\('i',\s*{[^}]*},\s*\))?\s*\)/g, '');
  content = content.replace(/,\s*React\.createElement\('th',\s*{([^}]*)},\s*React\.createElement\('button',\s*{[^}]*},\s*"Views"\s*,\s*[^)]*\s*\)\s*\)/g, '');
  content = content.replace(/,\s*React\.createElement\('td',\s*{([^}]*)},\s*p\.views\s*\)/g, '');
  
  // JSX:
  content = content.replace(/<th([^>]*)>Views(\s*<i[^>]*><\/i>)?\s*<\/th>/g, '');
  content = content.replace(/<th([^>]*)>\s*<button([^>]*)>Views[\s\S]*?<\/button>\s*<\/th>/g, '');
  content = content.replace(/<td([^>]*)>\{p\.views\}<\/td>/g, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

function walk(dir) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

walk(componentsDir);

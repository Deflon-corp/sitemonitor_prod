const fs = require('fs');
const path = require('path');

const componentsDir = 'd:/sitemonitor/Frontend/src/components';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace table headers for "Open Issue Page"
  content = content.replace(/<th([^>]*)>Open Issue Page<\/th>/g, '<th$1 className="fw-semibold text-body py-3 text-center" style={{ width: 100 }}>Details</th>');
  content = content.replace(/<th([^>]*)>Open issue page<\/th>/g, '<th$1 className="fw-semibold text-body py-3 text-center" style={{ width: 100 }}>Details</th>');
  
  // React.createElement style replacement for "Open Issue Page"
  content = content.replace(/,\s*React\.createElement\('th',\s*{([^}]*)},\s*"Open Issue Page"\s*\)/g, ", React.createElement('th', { className: \"fw-semibold text-body py-3 text-center\", style: { width: 100 } }, \"Details\")");
  content = content.replace(/,\s*React\.createElement\('th',\s*{([^}]*)},\s*"Open issue page"\s*\)/g, ", React.createElement('th', { className: \"fw-semibold text-body py-3 text-center\", style: { width: 100 } }, \"Details\")");

  // Remove empty Action header in default variant of DictionarySection/MisspellingsSection
  content = content.replace(/<th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 120 }} \/>/g, '');
  content = content.replace(/<th className="py-3 pe-4 text-body fs-13 fw-semibold" style={{ width: 80 }}>Details<\/th>/g, ''); // the existing Details column if present

  // Remove <th...Action...</th>
  content = content.replace(/<th([^>]*)>Action(\s*<i[^>]*><\/i>)?\s*<\/th>/g, '');
  content = content.replace(/<th([^>]*)>Action\s*.*?<\/th>/g, '');
  content = content.replace(/,\s*React\.createElement\('th',\s*{([^}]*)},\s*"Action"\s*\)/g, "");

  // For the actual "Open issue page" button, change icon to isax-document-text
  content = content.replace(/<button([^>]*)title="Open issue page"([^>]*)>\s*<i className="isax isax-info-circle([^"]*)"([^>]*)>\s*(?:<\/i>)?/g, 
    '<button$1title="View details"$2>\n                        <i className="isax isax-document-text$3"$4></i>');
  content = content.replace(/<button([^>]*)title="Open misspelling page"([^>]*)>\s*<i className="isax isax-info-circle([^"]*)"([^>]*)>\s*(?:<\/i>)?/g, 
    '<button$1title="View details"$2>\n                        <i className="isax isax-document-text$3"$4></i>');
  content = content.replace(/<button([^>]*)title="Open dictionary entry page"([^>]*)>\s*<i className="isax isax-info-circle([^"]*)"([^>]*)>\s*(?:<\/i>)?/g, 
    '<button$1title="View details"$2>\n                        <i className="isax isax-document-text$3"$4></i>');

  // React.createElement icon changes
  content = content.replace(/title:\s*"Open issue page"[^}]*},\s*React\.createElement\('i',\s*{ className:\s*"isax isax-info-circle([^"]*)"/g, 
    'title: "View details", onClick: () => onOpenIssue?.(row.id) }, React.createElement(\'i\', { className: "isax isax-document-text$1"');

  // Remove the whole td containing the Action dropdown
  content = content.replace(/<td([^>]*)>\s*<div className="d-inline-flex align-items-center gap-1">\s*<div className="dropdown d-inline-block">[\s\S]*?<\/ul>\s*<\/div>\s*<\/div>\s*<\/td>/g, '');
  content = content.replace(/<td([^>]*)>\s*<div className="dropdown d-inline-block(?: ms-1)?">[\s\S]*?<\/ul>\s*<\/div>\s*<\/td>/g, '');
  
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
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walk(componentsDir);

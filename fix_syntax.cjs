const fs = require('fs');

const files = [
  'd:/sitemonitor/Frontend/src/components/prioritized-content/MisspellingsSection.jsx',
  'd:/sitemonitor/Frontend/src/components/prioritized-content/DictionarySection.jsx',
  'd:/sitemonitor/Frontend/src/components/prioritized-content/PotentialMisspellingsSectionPageDetails.jsx',
  'd:/sitemonitor/Frontend/src/components/prioritized-content/IgnoredSpellingsSection.jsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\{!hideDetailsColumn && \}/g, '');
    fs.writeFileSync(file, content);
  }
}

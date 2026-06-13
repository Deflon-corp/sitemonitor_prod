const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '../src/components/policies');

const files = fs.readdirSync(dir).filter(f => f.startsWith('NewRule') && f.endsWith('Drawer.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already has initialData
  if (content.includes('initialData')) continue;

  // Change function signature
  content = content.replace(/(\{ open, onClose, onSave \}) => \{/, '{ open, onClose, onSave, initialData }) => {');

  // Find all useState variables
  const regex = /const \[(.+?),/g;
  let match;
  const stateVars = [];
  while ((match = regex.exec(content)) !== null) {
    stateVars.push(match[1]);
  }

  // Create useEffect content
  let settersWithInitial = '';
  let settersWithoutInitial = '';
  for (const v of stateVars) {
    const setterName = 'set' + v.charAt(0).toUpperCase() + v.slice(1);
    
    // find default value from original code
    // Escape regex characters just in case
    const useStateRegex = new RegExp('const \\\\[' + v + ', ' + setterName + '\\\\] = useState\\\\((.*)\\\\);');
    const useStateMatch = content.match(useStateRegex);
    let defaultVal = '""';
    if (useStateMatch && useStateMatch[1]) {
      defaultVal = useStateMatch[1];
    }
    
    settersWithInitial += `      ${setterName}(initialData?.${v} !== undefined ? initialData.${v} : ${defaultVal});\n`;
    settersWithoutInitial += `      ${setterName}(${defaultVal});\n`;
  }

  const useEffectBlock = `
  useEffect(() => {
    if (open && initialData) {
${settersWithInitial}    } else if (open && !initialData) {
${settersWithoutInitial}    }
  }, [open, initialData]);
`;

  // Insert useEffect block before the existing useEffect
  content = content.replace(/ {2}useEffect\(\(\) => \{\n {4}if \(\!open\) return;/, useEffectBlock + '\n  useEffect(() => {\n    if (!open) return;');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', file);
}

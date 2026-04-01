import fs from 'fs';
import path from 'path';

const replaceInFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  const replaces = [
    { from: /import \{ useExamStore \} from '(\.\.\/|\.\/)store\/useExamStore';/g, to: "import { useExams } from '$1hooks/useExams';" },
    { from: /import \{ usePlannerStore \} from '(\.\.\/|\.\/)store\/usePlannerStore';/g, to: "import { useWeekBlocks } from '$1hooks/useWeekBlocks';" },
    { from: /import \{ useHabitStore \} from '(\.\.\/|\.\/)store\/useHabitStore';/g, to: "import { useHabits } from '$1hooks/useHabits';" },
    { from: /import \{ useMateriaStore(.*?)\} from '(\.\.\/|\.\/)store\/useMateriaStore';/g, to: "import { useMaterias$1} from '$2hooks/useMaterias';" },
    { from: /useExamStore\(\)/g, to: 'useExams()' },
    { from: /usePlannerStore\(\)/g, to: 'useWeekBlocks()' },
    { from: /useHabitStore\(\)/g, to: 'useHabits()' },
    { from: /useMateriaStore\(\)/g, to: 'useMaterias()' },
  ];

  replaces.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  });

  // some specific cleanups as useFilters and things might be broken.
  // Wait, I will just do simple store-hooks replacements.

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated:', filePath);
  }
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'Dashboard.tsx' || file === 'App.tsx' || file === 'Login.tsx') continue; // manually handled
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walkSync(filepath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      replaceInFile(filepath);
    }
  }
};

walkSync(path.join(process.cwd(), 'src'));

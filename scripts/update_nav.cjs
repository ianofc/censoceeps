const fs = require('fs');
let content = fs.readFileSync('src/components/FloatingNav.tsx', 'utf8');

content = content.replace(/Headset\s*\} from 'lucide-react';/, "Headset, Settings } from 'lucide-react';");

content = content.replace(/import \{ useNavigate, useLocation \} from 'react-router-dom';/, 
  "import { useNavigate, useLocation } from 'react-router-dom';\nimport { useUserSession } from '../hooks/useUserSession';");

content = content.replace(/const location = useLocation\(\);/, 
  "const location = useLocation();\n  const { isTeacher, isAdmin } = useUserSession();");

const newSecondary = `  const secondaryItems = [
    { id: '/biblioteca', label: 'Biblioteca Viva', icon: Library, activeColor: 'bg-blue-600 shadow-blue-600/30' },
    { id: '/ouvidoria', label: 'Ouvidoria', icon: Headset, activeColor: 'bg-rose-600 shadow-rose-600/30' },
    { id: '/telao', label: 'Modo Telão', icon: Tv2, activeColor: 'bg-blue-600 shadow-blue-600/30' },
    { id: '/sobre', label: 'Sobre o Projeto', icon: Info, activeColor: 'bg-blue-600 shadow-blue-600/30' }
  ];

  if (isTeacher) {
    secondaryItems.push({ id: '/auditoria', label: 'Painel Docente', icon: FolderCheck, activeColor: 'bg-blue-600 shadow-blue-600/30' });
  }
  if (isAdmin) {
    secondaryItems.push({ id: '/admin', label: 'Administração', icon: Settings, activeColor: 'bg-red-600 shadow-red-600/30' });
  }`;

content = content.replace(/  const secondaryItems = \[\s*\{ id: '\/biblioteca'[\s\S]*?\}\s*\];/, newSecondary);

fs.writeFileSync('src/components/FloatingNav.tsx', content);
console.log('Done');

const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('const Admin = lazy')) {
  content = content.replace(/const TeacherDashboard = lazy[^\n]*\n/, 
    "const TeacherDashboard = lazy(() => import('./components/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));\nconst Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));\n");
}

if (!content.includes('<Route path="/admin" element={<Admin />} />')) {
  content = content.replace(/<Route path="\/auditoria" element=\{<TeacherDashboard \/>\} \/>/, 
    '<Route path="/auditoria" element={<TeacherDashboard />} />\n              <Route path="/admin" element={<Admin />} />');
}

fs.writeFileSync('src/App.tsx', content);
console.log('Done');

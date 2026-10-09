const fs = require('fs');
let code = fs.readFileSync('src/components/FloatingNav.tsx', 'utf8');

// 1. Make dialog work on desktop
code = code.replace(
  /className="fixed inset-0 z-50 m-0 w-full h-full bg-blue-950\/70 backdrop-blur-md lg:hidden flex flex-col justify-end p-4 border-0"/g,
  'className="fixed inset-0 z-50 m-0 w-full h-full bg-blue-950/70 backdrop-blur-md flex flex-col justify-end lg:justify-center lg:items-center p-4 border-0"'
);

// Fallback in case it still had slate-950/70
code = code.replace(
  /className="fixed inset-0 z-50 m-0 w-full h-full bg-slate-950\/70 backdrop-blur-md lg:hidden flex flex-col justify-end p-4 border-0"/g,
  'className="fixed inset-0 z-50 m-0 w-full h-full bg-blue-950/70 backdrop-blur-md flex flex-col justify-end lg:justify-center lg:items-center p-4 border-0"'
);


code = code.replace(
  /className="relative z-10 bg-blue-900 border border-blue-700\/60 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 text-white animate-in fade-in slide-in-from-bottom-6 mb-20 max-h-\[80vh\] overflow-y-auto"/g,
  'className="relative z-10 bg-blue-900 border border-blue-700/60 rounded-3xl p-5 shadow-2xl flex flex-col gap-3 text-white animate-in fade-in slide-in-from-bottom-6 lg:zoom-in-95 mb-20 lg:mb-0 max-h-[80vh] overflow-y-auto w-full lg:w-[380px]"'
);

// 2. Make the mobile items container responsive to work on desktop as well
code = code.replace(
  /className="lg:hidden flex items-center justify-around w-full gap-1"/g,
  'className="flex max-lg:flex-row max-lg:justify-around lg:flex-col items-center w-full gap-1 lg:gap-3"'
);

// 3. Remove the old Desktop Nav and Desktop Footer
code = code.replace(
  /\{\/\* Itens Desktop \(Vertical lateral\) \*\/\}(.|\n)*?<\/aside>/,
  '</aside>'
);

// 4. Remove the Avatar from desktop sidebar
code = code.replace(
  /\{\/\* Topo Desktop: Logo \/ Avatar Ada \*\/\}(.|\n)*?\{\/\* Itens Mobile \(Otimizados para telas pequenas\) \*\/\}/,
  '{/* Itens Unificados (Mobile e Desktop) */}'
);

fs.writeFileSync('src/components/FloatingNav.tsx', code);

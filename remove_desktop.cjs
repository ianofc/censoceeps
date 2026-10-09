const fs = require('fs');
let code = fs.readFileSync('src/components/FloatingNav.tsx', 'utf8');

const startIndex = code.indexOf('{/* Itens Desktop (Vertical lateral) */}');
if (startIndex !== -1) {
    const endIndex = code.lastIndexOf('</aside>');
    code = code.substring(0, startIndex) + '</aside>';
}

const avatarIndex = code.indexOf('{/* Topo Desktop: Logo / Avatar Ada */}');
if (avatarIndex !== -1) {
    const endAvatarIndex = code.indexOf('{/* Itens Mobile');
    if (endAvatarIndex !== -1) {
        code = code.substring(0, avatarIndex) + code.substring(endAvatarIndex);
    }
}

code = code.replace('{/* Itens Mobile (Otimizados para telas pequenas) */}', '{/* Itens Unificados (Mobile e Desktop) */}');

fs.writeFileSync('src/components/FloatingNav.tsx', code);

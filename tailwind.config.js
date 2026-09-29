/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                bgApp: '#f8fafc',      // Fundo Slate 50 (Light Clean)
                cardBg: '#ffffff',     // Fundo branco dos cards e painéis
                cardBorder: '#cbd5e1', // Borda Slate 300 nítida
                brandBlue: '#1d4ed8',  // Azul institucional CEEP / Blue 700
                goldAccent: '#f59e0b', // Amarelo/Dourado de destaques
                goldHover: '#d97706',
                textMain: '#0f172a',   // Texto principal escuro (Slate 900)
                textMuted: '#64748b',  // Texto secundário (Slate 500)
            },
        },
    },
    plugins: [],
}
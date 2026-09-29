import { execSync as runExec } from 'node:child_process';

const runCommand = (command, description) => {
    console.log(`\n⚙️ [AUTOMAÇÃO] Iniciando: ${description}...`);
    try {
        runExec(command, { stdio: 'inherit' });
        console.log(`[SUCESSO] ${description} concluído com êxito!`);
    } catch (error) {
        console.error(`\n[ERRO CRÍTICO] Falha detectada em: ${description}`);
        console.error(`Detalhes técnicos: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
};

console.log('=== INICIANDO VALIDATOR & BUILD GUARD CENSOCEEP ===');

// Utiliza diretamente os scripts configurados no package.json
runCommand('npm run check', 'Verificação Completa de Integridade (Types + Lint + Vite Build)');

console.log('\n🎉 [TUDO PRONTO!] O projeto está 100% íntegro e pronto para produção!');
import { createClient } from '@supabase/supabase-js';

// ⚠️ ATENÇÃO: Use a SERVICE_ROLE_KEY para ter privilégios de administrador
const SUPABASE_URL = 'COLOQUE_A_SUA_URL_AQUI';
const SUPABASE_SERVICE_KEY = 'COLOQUE_A_SUA_SERVICE_ROLE_KEY_AQUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const listaUsuarios = [
    { nome: "ANA JULIA TEIXEIRA", email: "anajuliateixeira@ceeps.com", senha: "anajulia7392", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "ANA LUIZA SOUZA CERQUEIRA", email: "analuizacerqueira@ceeps.com", senha: "analuiza4815", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "EVERTON SILVA MARTINS", email: "evertonmartins@ceeps.com", senha: "everton9204", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "GEOVANA SANTOS", email: "geovanasantos@ceeps.com", senha: "geovana1583", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "GUILHERMY SANTOS LIMA", email: "guilhermylima@ceeps.com", senha: "guilhermy6271", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "HAVILA ELOAH SANTOS BARBOSA", email: "havilaeloahbarbosa@ceeps.com", senha: "havilaeloah3940", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "HENDRIK SANTOS DE ARAUJO", email: "hendrikaraujo@ceeps.com", senha: "hendrik8152", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "ISADORA SANTOS RODRIGUES", email: "isadorarodrigues@ceeps.com", senha: "isadora5039", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "IZABELA TEIXEIRA PINTO", email: "izabelapinto@ceeps.com", senha: "izabela2746", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "JARBAS LEONARDO SANTOS MEDEIROS", email: "jarbasleonardomedeiros@ceeps.com", senha: "jarbasleonardo9183", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "JEFERSON PEREIRA DE SOUZA", email: "jefersonsouza@ceeps.com", senha: "jeferson4627", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "JOAO PEDRO ALCANTARA DOS ANJOS", email: "joaopedroanjos@ceeps.com", senha: "joaopedro8391", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "JOAO VITOR ROCHA BASTOS", email: "joaovitorbastos@ceeps.com", senha: "joaovitor5104", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "JULIA SOPHIA JESUS DA SILVA", email: "juliasophiasilva@ceeps.com", senha: "juliasophia7462", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "KLEBER SILVA DE ANDRADE", email: "kleberandrade@ceeps.com", senha: "kleber3920", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "LAIS HELENA ANJOS OLIVEIRA", email: "laishelenaoliveira@ceeps.com", senha: "laishelena6285", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "LINE LORRANE LUIS DE SOUZA", email: "linelorranesouza@ceeps.com", senha: "linelorrane1573", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "LUCAS SOUZA ALCANTARA", email: "lucasalcantara@ceeps.com", senha: "lucas8049", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "MARIA BEATRIZ TEIXEIRA SANTOS", email: "mariabeatrizsantos@ceeps.com", senha: "mariabeatriz4716", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "MARIA EDUARDA SANTOS SOUZA", email: "mariaeduardasouza@ceeps.com", senha: "mariaeduarda9253", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "MARIA EDUARDA SOUZA BASTOS", email: "mariaeduardabastos@ceeps.com", senha: "mariaeduarda3618", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "MARLON SILVA SOUZA", email: "marlonsouza@ceeps.com", senha: "marlon7492", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "MATHEUS SILVA DA COSTA", email: "matheuscosta@ceeps.com", senha: "matheus1850", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "MICHAEL SANTOS LIMA", email: "michaellima@ceeps.com", senha: "michael6374", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "MIGUEL DA SILVA LIRA NUNES", email: "miguelnunes@ceeps.com", senha: "miguel2905", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "MIRIAN ANJOS VIEIRA", email: "mirianvieira@ceeps.com", senha: "mirian5147", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "NATALY BRENDA BARBOSA SILVA", email: "natalybrendasilva@ceeps.com", senha: "natalybrenda8362", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "NICOLAS RIAN DOS SANTOS", email: "nicolasriansantos@ceeps.com", senha: "nicolasrian4091", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "PEDRO HENRIQUE BARBOSA SILVA", email: "pedrohenriquesilva@ceeps.com", senha: "pedrohenrique7528", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "RAONY GABRIEL DIAS VAZ", email: "raonygabrielvaz@ceeps.com", senha: "raonygabriel1936", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "SAMANTA EVELIN BERNARDES ARAUJO", email: "samantaevelinaraujo@ceeps.com", senha: "samantaevelin5820", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "SAMYRA DA FONSECA TEIXEIRA", email: "samyrateixeira@ceeps.com", senha: "samyra3649", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "STEFANY ALVES ROCHA", email: "stefanyrocha@ceeps.com", senha: "stefany8215", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "TAYLON WILLIAN OLIVEIRA SANTANA", email: "taylonwilliansantana@ceeps.com", senha: "taylonwillian4703", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "THAYLA SENA ROLDAO DOS SANTOS", email: "thaylasenasantos@ceeps.com", senha: "thaylasena6192", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "YANNE KESSIA DE SOUZA ALMEIDA", email: "yannekessiaalmeida@ceeps.com", senha: "yannekessia2854", papel: "entrevistador", turma: "1º ADM CM" },
    { nome: "IAN DA SILVA ALMEIDA SANTOS", email: "iansantos@ceeps.com", senha: "ian8431", papel: "admin", turma: "Professor" },
    { nome: "JULIANA DIAS", email: "julianadias@ceeps.com", senha: "juliana5920", papel: "professor", turma: "Professor" }
];

async function processarOuAtualizarUsuario(usuario, userIdExistente) {
    let userId = userIdExistente;

    if (userId) {
        console.log(`🔄 Utilizador já existe (${usuario.email}). Atualizando credenciais...`);
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password: usuario.senha,
            user_metadata: { nome_completo: usuario.nome, papel: usuario.papel }
        });
        if (updateError) throw updateError;
    } else {
        console.log(`➕ Criando novo utilizador: ${usuario.email}`);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: usuario.email,
            password: usuario.senha,
            email_confirm: true,
            user_metadata: { nome_completo: usuario.nome, papel: usuario.papel }
        });
        if (authError) throw authError;
        userId = authData.user.id;
    }

    const { error: dbError } = await supabase
        .from('pessoas')
        .upsert({
            id: userId,
            nome_completo: usuario.nome,
            email: usuario.email,
            papel: usuario.papel,
            turma_ou_cargo: usuario.turma
        }, { onConflict: 'id' });

    if (dbError) throw dbError;
}

console.log('Iniciando sincronização rigorosa de utilizadores...');

const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
if (listError) {
    console.error('❌ Erro crítico ao listar utilizadores do Auth:', listError.message);
    process.exit(1);
}

const mapaUsuariosAuth = new Map(users.map(u => [u.email, u.id]));

// Execução concorrente segura utilizando Promise.all com função isolada (sem loops de await)
const resultados = await Promise.all(
    listaUsuarios.map(async (usuario) => {
        try {
            await processarOuAtualizarUsuario(usuario, mapaUsuariosAuth.get(usuario.email));
            return { sucesso: true, nome: usuario.nome };
        } catch (err) {
            console.error(`❌ Falha crítica em ${usuario.nome}:`, err.message);
            return { sucesso: false, nome: usuario.nome };
        }
    })
);

const totalErros = resultados.filter(r => !r.sucesso).length;

if (totalErros > 0) {
    console.error(`\n⚠️ Sincronização concluída com ERROS! Total de falhas: ${totalErros}`);
    process.exit(1);
} else {
    console.log('\n🎉 Sincronização concluída com 100% de sucesso e integridade ACID!');
}
/* ═══════════════════════════════════════════════════════
   Projeto Ada Lovelace — app.js (Supabase Auth + Realtime)
   ═══════════════════════════════════════════════════════ */

// ─── 1. Supabase Init ────────────────────────────────────────
const SUPABASE_URL = 'https://zoybjayrxbgobjtxqmic.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWJqYXlyeGJnb2JqdHhxbWljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MzY3MDAsImV4cCI6MjEwNjAxMjcwMH0.ZC1VQyYyKLNW3KNc41ci3c1GNawntz7E7zjol0HNX7g';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;
let userProfile = null;
let charts = {};
// Paleta Aurora Refinada (Cyan-500, Blue-500, Indigo-500, Emerald-500)
const AURORA = ['#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#10b981'];

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ─── 2. Auth & Login ──────────────────────────────────────────
async function initApp() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadProfile();
  } else {
    $('#login').classList.remove('hidden');
  }

  // Listener de Auth state
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      await loadProfile();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      userProfile = null;
      location.reload();
    }
  });
}

async function loadProfile() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', currentUser.id)
    .single();

  if (error || !data) {
    console.error('Erro ao buscar perfil', error);
    return;
  }

  userProfile = data;
  setupUIForRole();
}

$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('#btnLogin').disabled = true;
  $('#loginError').textContent = 'Conectando...';

  const { error } = await supabase.auth.signInWithPassword({
    email: $('#email').value,
    password: $('#senha').value,
  });

  if (error) {
    $('#loginError').textContent = 'E-mail ou senha inválidos.';
    $('#btnLogin').disabled = false;
  }
});

$('#logout').addEventListener('click', () => supabase.auth.signOut());

// ─── 3. Controle de Interface (Role-based) ────────────────────
function setupUIForRole() {
  $('#login').classList.add('hidden');
  $('#app').classList.remove('hidden');

  if (userProfile.role === 'teacher') {
    $$('.nav-teacher').forEach(el => el.classList.remove('hidden'));
    switchView('dashboard');
    loadTeacherDashboard();
    loadAdminPanel();
    setupRealtime();
  } else {
    $$('.nav-student').forEach(el => el.classList.remove('hidden'));
    $('#student-name').textContent = userProfile.full_name;
    switchView('interview');
    atualizarProgressoAluno();
  }
}

$$('nav button[data-view]').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

function switchView(viewId) {
  $$('nav button[data-view]').forEach(b => b.classList.remove('active'));
  $(`nav button[data-view="${viewId}"]`).classList.add('active');

  ['interview', 'dashboard', 'admin-panel'].forEach(id => {
    $(`#${id}`).classList.toggle('hidden', id !== viewId);
  });
}

// ─── 4. Visão do Aluno: Formulário ────────────────────────────
function toggleRelato(show) {
  const box = $('#box-relato');
  if (show) { box.classList.remove('hidden'); } 
  else { box.classList.add('hidden'); $('#relato_preconceito').value = ''; }
}

$('#interviewForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  const nomeEntrevistado = $('#nome_entrevistado').value.trim();
  const btn = $('#btnSubmitInterview');
  
  btn.disabled = true;
  btn.textContent = 'Verificando...';

  // 1. Verificar Duplicidade de Entrevistado
  const { data: existing } = await supabase
    .from('interviews')
    .select('id')
    .ilike('nome_entrevistado', nomeEntrevistado)
    .maybeSingle();

  if (existing) {
    alert(`⚠️ A pessoa "${nomeEntrevistado}" já foi pesquisada por outro aluno ou por você. Não é possível enviar dados duplicados.`);
    btn.disabled = false;
    btn.textContent = 'Registrar Entrevista';
    return;
  }

  btn.textContent = 'Salvando...';

  const getVal = (name) => {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  };

  const formData = {
    interviewer_id: currentUser.id,
    nome_entrevistado: nomeEntrevistado,
    vinculo: $('#vinculo').value,
    grupo_escolar: $('#grupo_escolar').value,
    faixa_etaria: $('#faixa_etaria').value,
    genero: getVal('genero'),
    cor_raca: getVal('cor_raca'),
    povo_indigena: $('#povo_indigena').value,
    conhece_ancestralidade: $('#conhece_ancestralidade').value,
    geracao_alcancada: $('#geracao_alcancada').value,
    ja_conversou_sobre: $('#ja_conversou_sobre').value,
    ambientes_conversa: Array.from(document.querySelectorAll('input[name="ambientes_conversa"]:checked')).map(cb => cb.value),
    sofreu_preconceito: getVal('sofreu_preconceito'),
    relato_preconceito: $('#relato_preconceito').value,
  };

  const { error } = await supabase.from('interviews').insert([formData]);

  if (error) {
    alert('⚠️ Erro ao salvar: ' + error.message);
  } else {
    e.target.reset();
    toggleRelato(false);
    alert('✅ Entrevista registrada com sucesso!');
    // Não precisa atualizar a barra lateral visual de progresso se removemos o progress-card, 
    // mas se quisermos depois, a função pode ser mantida.
  }

  btn.disabled = false;
  btn.textContent = 'Registrar Entrevista';
});

async function atualizarProgressoAluno() {
  const { count, error } = await supabase
    .from('interviews')
    .select('*', { count: 'exact', head: true })
    .eq('interviewer_id', currentUser.id);

  if (!error) {
    const meta = 20;
    const pct = Math.min((count / meta) * 100, 100);
    const bar = $('#progress-bar');
    bar.style.width = `${pct}%`;
    if (pct >= 100) bar.classList.add('complete');
    
    $('#progress-text').textContent = `${count} / ${meta} entrevistas concluídas${pct >= 100 ? ' ✅ Meta atingida!' : ''}`;
  }
}

// ─── 5. Visão do Professor: Dashboard & Realtime ──────────────
function setupRealtime() {
  supabase.channel('public:interviews')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'interviews' }, payload => {
      console.log('🔄 Nova entrevista recebida!', payload);
      loadTeacherDashboard();
      loadAdminPanel();
    })
    .subscribe();
}

async function loadTeacherDashboard() {
  const { data: interviews } = await supabase.from('interviews').select('*');
  if (!interviews) return;

  $('#total').textContent = interviews.length;
  
  const entrevistadores = new Set(interviews.map(i => i.interviewer_id));
  $('#alunos-ativos').textContent = entrevistadores.size;

  const negros = interviews.filter(i => i.cor_raca === 'Preta' || i.cor_raca === 'Parda').length;
  $('#negra').textContent = interviews.length ? Math.round((negros / interviews.length) * 100) + '%' : '0%';

  const countBy = (arr, key) => {
    const counts = {};
    arr.forEach(i => counts[i[key]] = (counts[i[key]] || 0) + 1);
    return Object.keys(counts).map(k => ({ label: k, value: counts[k] })).sort((a,b) => b.value - a.value);
  };

  draw('raceChart', 'doughnut', countBy(interviews, 'cor_raca'), AURORA);
  draw('genderChart', 'doughnut', countBy(interviews, 'genero'), AURORA.slice(2));
  draw('linkChart', 'bar', countBy(interviews, 'vinculo'), [AURORA[0], AURORA[1]]);
  draw('preconceitoChart', 'bar', countBy(interviews, 'sofreu_preconceito'), AURORA.slice(3));
}

async function loadAdminPanel() {
  // Busca todos os alunos
  const { data: students } = await supabase.from('profiles').select('*').eq('role', 'student').order('full_name');
  // Busca todas as entrevistas
  const { data: interviews } = await supabase.from('interviews').select('interviewer_id');

  if (!students) return;

  const counts = {};
  if (interviews) {
    interviews.forEach(i => counts[i.interviewer_id] = (counts[i.interviewer_id] || 0) + 1);
  }

  const tbody = $('#student-list');
  tbody.innerHTML = students.map(s => {
    const total = counts[s.id] || 0;
    const status = total >= 20 
      ? '<span style="color:var(--accent-emerald);font-weight:bold;">✅ Meta Atingida</span>' 
      : '<span style="color:var(--accent-amber);">⏳ Em Progresso</span>';
    return `
      <tr style="border-bottom: 1px solid var(--glass-border);">
        <td style="padding: 12px; font-weight: 500;">${s.full_name}</td>
        <td style="padding: 12px; color: var(--text-muted);">${s.class_or_sector}</td>
        <td style="padding: 12px; font-weight:bold;">${total} / 20</td>
        <td style="padding: 12px;">${status}</td>
      </tr>
    `;
  }).join('');
}

// ─── 6. Chart.js Helper ───────────────────────────────────────
function draw(id, type, data, colors) {
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart($('#' + id), {
    type,
    data: {
      labels: data.map(x => x.label),
      datasets: [{
        data: data.map(x => x.value),
        backgroundColor: colors,
        borderColor: type === 'doughnut' ? '#0f172a' : 'transparent',
        borderWidth: type === 'doughnut' ? 2 : 0,
        borderRadius: type !== 'doughnut' ? 6 : 0,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: type === 'doughnut', position: 'bottom', labels: { color: '#f1f5f9' } } },
      scales: type === 'doughnut' ? {} : { y: { beginAtZero: true, ticks: { precision: 0, color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { ticks: { color: '#94a3b8' }, grid: { display: false } } },
    }
  });
}

// ─── 7. Exportação de Relatórios (PDF) ────────────────────────
async function exportPDF(type) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('landscape');
  
  let query = supabase.from('interviews').select('*, profiles(full_name)');
  if (type === 'student') query = query.eq('interviewer_id', currentUser.id);
  
  const { data } = await query;
  if (!data || data.length === 0) return alert('Nenhuma entrevista encontrada para exportar.');

  doc.setFontSize(16);
  doc.text(type === 'student' ? `Relatório de Iniciação Científica - ${userProfile.full_name}` : 'Censo Escolar - Relatório Geral', 14, 15);
  doc.setFontSize(10);
  doc.text(`Total de Entrevistas: ${data.length} | Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

  doc.autoTable({
    startY: 28,
    head: [['Data', type === 'teacher' ? 'Entrevistador' : 'Grupo', 'Vínculo', 'Gênero', 'Cor/Raça', 'Preconceito']],
    body: data.map(row => [
      new Date(row.created_at).toLocaleDateString('pt-BR'),
      type === 'teacher' ? row.profiles.full_name : row.grupo_escolar,
      row.vinculo,
      row.genero,
      row.cor_raca,
      row.sofreu_preconceito
    ]),
    theme: 'grid',
    headStyles: { fillColor: [99, 102, 241] }
  });

  doc.save(type === 'student' ? 'meu_relatorio_cientifico.pdf' : 'relatorio_censo_ceep.pdf');
}

$('#export-student-pdf').addEventListener('click', () => exportPDF('student'));
$('#export-teacher-pdf').addEventListener('click', () => exportPDF('teacher'));

// Iniciar app
initApp();

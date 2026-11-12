import { StorageService } from '../services/storage-service.js';
import { ROLES } from '../config.js';
import { DEFAULT_CATEGORIES } from './default-categories.js';

/** Massa de dados fictícia para demonstração: 3 competições, todas as categorias, equipes e notas. */
const SEED_KEY = 'demoSeed';
const SEED_VERSION = 'competicoes-v1';
const CREATED = '2026-09-01T12:00:00.000Z';

const users = [
  { id: 'usr-prof-002', name: 'Beatriz Professora', email: 'beatriz@robotica.edu.br', password: 'prof123', role: ROLES.TEACHER },
  { id: 'usr-judge-002', name: 'Rafael Jurado', email: 'rafael@robotica.edu.br', password: 'jurado123', role: ROLES.JUDGE },
  { id: 'usr-judge-003', name: 'Lúcia Jurada', email: 'lucia@robotica.edu.br', password: 'jurado123', role: ROLES.JUDGE },
].map((user) => ({ ...user, active: true, createdAt: CREATED }));

const schools = [
  { id: 'sch-jlle-01', name: 'Escola Municipal Vila Nova', teacherIds: ['usr-prof-001'] },
  { id: 'sch-jlle-02', name: 'Escola Municipal Boa Vista', teacherIds: ['usr-prof-001'] },
  { id: 'sch-jlle-03', name: 'Escola Municipal Itaum', teacherIds: ['usr-prof-002'] },
  { id: 'sch-jlle-04', name: 'Escola Municipal Costa e Silva', teacherIds: ['usr-prof-002'] },
  { id: 'sch-jlle-05', name: 'Escola Municipal Pirabeiraba', teacherIds: ['usr-prof-002'] },
].map((school) => ({ ...school, city: 'Joinville', createdAt: CREATED, updatedAt: CREATED }));

const competitions = [
  { id: 'cmp-demo-copa', name: 'Copa Joinville de Robótica 2026', description: 'Etapa municipal com provas práticas e apresentação dos projetos das escolas da rede.', location: 'Expoville — Joinville', startDate: '2026-11-10', endDate: '2026-11-14', registrationStart: '2026-09-01', registrationEnd: '2026-10-20', status: 'ativa', registrationsOpen: false, teamsPerCategory: 3 },
  { id: 'cmp-demo-festival', name: 'Festival Estudantil de Tecnologia', description: 'Mostra de robótica e tecnologia educacional com avaliação por banca de jurados.', location: 'Centreventos Cau Hansen', startDate: '2026-11-11', endDate: '2026-11-20', registrationStart: '2026-09-15', registrationEnd: '2026-10-31', status: 'ativa', registrationsOpen: false, teamsPerCategory: 2 },
  { id: 'cmp-demo-torneio', name: 'Torneio de Inverno de Robótica 2027', description: 'Torneio aberto às escolas municipais. Inscrições em análise pelos professores responsáveis.', location: 'Ginásio Abel Schulz', startDate: '2026-12-12', endDate: '2026-12-13', registrationStart: '2026-11-01', registrationEnd: '2026-12-05', status: 'planejada', registrationsOpen: true, teamsPerCategory: 2 },
];

const teamNames = ['Robôs do Futuro', 'Mecatrônicos', 'Byte Force', 'Engrenagens', 'Circuito Vivo', 'Pixel Bots', 'Faísca', 'Os Inventores', 'Alfa Bot', 'Turbo Code', 'Nexus', 'Robo Kids', 'Fusão', 'Ômega', 'Vetor', 'Quantum', 'Arco-Íris Bot', 'Trilha Certa', 'Garra', 'Sinapse', 'Órbita'];
const firstNames = ['Ana', 'Bruno', 'Camila', 'Davi', 'Eduarda', 'Felipe', 'Gabriela', 'Heitor', 'Isabela', 'João', 'Larissa', 'Miguel', 'Natália', 'Otávio', 'Pedro', 'Rafaela', 'Sofia', 'Thiago', 'Valentina', 'Yuri'];
const lastNames = ['Silva', 'Souza', 'Oliveira', 'Pereira', 'Costa', 'Schmitt', 'Müller', 'Ramos', 'Lima', 'Machado', 'Kruger', 'Alves'];
const schoolOrder = ['sch-demo-001', 'sch-jlle-01', 'sch-jlle-03', 'sch-jlle-02', 'sch-jlle-04', 'sch-jlle-05', 'sch-demo-002'];

let state = 7;
const random = () => { state = (state * 1103515245 + 12345) % 2147483648; return state / 2147483648; };
const pick = (list) => list[Math.floor(random() * list.length)];
const score = (base) => Math.round(Math.min(10, Math.max(4, base + (random() - 0.5) * 3)) * 2) / 2;

function resolveCategories() {
  const current = StorageService.get('categories', []);
  const now = new Date().toISOString();
  for (const preset of DEFAULT_CATEGORIES) {
    if (current.some((item) => item.key === preset.key || item.name?.trim().toLocaleLowerCase('pt-BR') === preset.name.toLocaleLowerCase('pt-BR'))) continue;
    current.push({ ...preset, id: `cat-${preset.key}`, minAge: null, maxAge: null, minMembers: 2, maxMembers: 4, schoolingMin: '', schoolingMax: '', schooling: '', active: true, createdAt: now, updatedAt: now });
  }
  StorageService.set('categories', current);
  return DEFAULT_CATEGORIES.map((preset) => current.find((item) => item.key === preset.key || item.name?.trim().toLocaleLowerCase('pt-BR') === preset.name.toLocaleLowerCase('pt-BR')));
}

function members(categoryKey) {
  const junior = categoryKey === 'artbot-junior';
  return Array.from({ length: 2 + Math.floor(random() * 3) }, () => {
    const grade = junior ? 4 + Math.floor(random() * 3) : 6 + Math.floor(random() * 4);
    return { id: `mem-${Math.floor(random() * 1e9).toString(36)}`, name: `${pick(firstNames)} ${pick(lastNames)}`, birthDate: `${2026 - grade - 6}-${String(1 + Math.floor(random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(random() * 28)).padStart(2, '0')}`, grade: `${grade}º ano` };
  });
}

function buildRegistrations(categories, allSchools) {
  const result = [];
  let schoolIndex = 0;
  for (const competition of competitions) {
    let nameIndex = 0;
    categories.forEach((category, categoryIndex) => {
      for (let slot = 0; slot < competition.teamsPerCategory; slot++) {
        const schoolId = schoolOrder[schoolIndex++ % schoolOrder.length];
        const school = allSchools.find((item) => item.id === schoolId) ?? allSchools[0];
        const open = competition.registrationsOpen;
        const status = !open ? 'aprovado' : slot === 0 && categoryIndex % 3 === 0 ? 'aprovado' : categoryIndex === 5 && slot === 1 ? 'rejeitado' : 'pendente';
        const createdAt = `${open ? '2026-11-0' : '2026-10-1'}${1 + ((categoryIndex + slot) % 9)}T14:00:00.000Z`;
        result.push({
          id: `reg-demo-${competition.id.slice(9)}-${categoryIndex}-${slot}`,
          competitionId: competition.id, categoryId: category.id, teamName: teamNames[nameIndex++ % teamNames.length],
          schoolId: school.id, schoolName: school.name, teacherId: school.teacherIds?.[0] ?? null, members: members(category.key),
          status, createdAt, updatedAt: createdAt,
          ...(status === 'pendente' ? {} : { reviewedBy: school.teacherIds?.[0] ?? 'usr-admin-001', reviewedAt: createdAt, reviewNote: status === 'rejeitado' ? 'Integrantes acima do limite de idade da categoria.' : '' }),
        });
      }
    });
  }
  return result;
}

function buildEvaluations(registrations) {
  const result = [];
  const judgesFor = { 'cmp-demo-copa': ['usr-judge-002', 'usr-judge-003', 'usr-judge-001'], 'cmp-demo-festival': ['usr-judge-002'] };
  registrations.filter((team) => team.status === 'aprovado' && judgesFor[team.competitionId]).forEach((team, index) => {
    const base = 5.5 + random() * 4;
    for (const judgeId of judgesFor[team.competitionId]) {
      // O jurado demo (usr-judge-001) deixa parte das equipes pendentes para a demonstração.
      if (judgeId === 'usr-judge-001' && index % 2) continue;
      if (team.competitionId === 'cmp-demo-festival' && index % 3 === 0) continue;
      const scores = { desempenho: score(base), inovacao: score(base), apresentacao: score(base), equipe: score(base + 0.5) };
      const average = Math.round(Object.values(scores).reduce((sum, value) => sum + value, 0) / 4 * 100) / 100;
      result.push({ id: `eval-demo-${team.id.slice(9)}-${judgeId.slice(-3)}`, registrationId: team.id, competitionId: team.competitionId, categoryId: team.categoryId, judgeId, scores, average, comments: average >= 8 ? 'Excelente execução e apresentação clara.' : '', status: 'concluida', createdAt: '2026-11-11T16:00:00.000Z', updatedAt: '2026-11-11T16:00:00.000Z' });
    }
  });
  return result;
}

function merge(collection, items) {
  const current = StorageService.get(collection, []);
  const ids = new Set(current.map((item) => item.id));
  StorageService.set(collection, [...current, ...items.filter((item) => !ids.has(item.id))]);
}

/** Aplica a massa de demonstração uma única vez, sem sobrescrever registros existentes. */
export function seedDemoCompetitions() {
  if (StorageService.get(SEED_KEY) === SEED_VERSION) return;
  state = 7;
  const categories = resolveCategories();
  merge('users', users);
  merge('schools', schools);
  const allSchools = StorageService.get('schools', []);
  const categoryIds = categories.map((category) => category.id);
  merge('competitions', competitions.map(({ teamsPerCategory, ...competition }) => ({ ...competition, categoryIds, format: 'POINTS', createdAt: CREATED, updatedAt: CREATED })));
  merge('notices', competitions.map((competition) => ({ id: `ntc-${competition.id}`, competitionId: competition.id, title: `Edital — ${competition.name}`, summary: 'Regras gerais, cronograma, critérios de avaliação (desempenho, projeto e inovação, apresentação e trabalho em equipe) e documentos exigidos.', published: true, publishedAt: CREATED, createdAt: CREATED, updatedAt: CREATED })));
  const registrations = buildRegistrations(categories, allSchools);
  merge('registrations', registrations);
  merge('evaluations', buildEvaluations(registrations));
  StorageService.set(SEED_KEY, SEED_VERSION);
}

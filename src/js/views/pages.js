import { ROLE_LABELS, ROLES } from '../config.js';
import { EntityService } from '../services/entity-service.js';
import { formatDate } from '../utils/format.js';
import { escapeHTML } from '../utils/dom.js';
import { renderCompetitions } from './competitions.js';

const sections = {
  competicoes: { title: 'Competições', description: 'Acompanhe os eventos de robótica da sua organização.', eyebrow: 'EVENTOS', icon: '◇' },
  inscricoes: { title: 'Inscrições', description: 'Gerencie as equipes inscritas nas competições.', eyebrow: 'PARTICIPAÇÃO', icon: '▤' },
  projetos: { title: 'Projetos', description: 'Conheça as ideias e soluções desenvolvidas pelas equipes.', eyebrow: 'INOVAÇÃO', icon: '⌘' },
  avaliacoes: { title: 'Avaliações', description: 'Acompanhe as avaliações atribuídas ao seu perfil.', eyebrow: 'JULGAMENTO', icon: '☆' },
  ajuda: { title: 'Central de ajuda', description: 'Encontre orientações para usar a plataforma.', eyebrow: 'SUPORTE', icon: '✳' },
};

export function renderPage(root, page, user) {
  if (page === 'competicoes') { renderCompetitions(root, user); return; }
  if (page !== 'inicio') return renderPlaceholder(root, page);
  const competitions = new EntityService('competitions').list();
  const projects = new EntityService('projects').list();
  const today = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  const roleIntro = user.role === ROLES.JUDGE ? 'Confira suas próximas atividades e avaliações.' : user.role === ROLES.TEACHER ? 'Acompanhe suas equipes e as próximas atividades.' : 'Aqui está o panorama da sua organização.';
  root.innerHTML = `<section class="welcome-row"><div><p class="eyebrow">${escapeHTML(today)}</p><h1>Olá, ${escapeHTML(user.name.split(' ')[0])} <span class="wave">✳</span></h1><p>${roleIntro}</p></div><div class="welcome-date"><span>SEU PERFIL</span><strong>${ROLE_LABELS[user.role]}</strong></div></section>
    <section class="metric-grid" aria-label="Resumo"><article class="metric-card"><div class="metric-top"><span class="metric-icon metric-icon--violet">◇</span><span class="metric-trend">Neste ciclo</span></div><span class="metric-label">Competições ativas</span><strong class="metric-value">${competitions.filter((item) => item.status === 'ativa').length.toString().padStart(2, '0')}</strong><span class="metric-caption">Eventos em andamento</span></article><article class="metric-card"><div class="metric-top"><span class="metric-icon metric-icon--blue">▤</span><span class="metric-trend">Sua organização</span></div><span class="metric-label">Inscrições recebidas</span><strong class="metric-value">${new EntityService('registrations').list().length.toString().padStart(2, '0')}</strong><span class="metric-caption">Equipes participantes</span></article><article class="metric-card"><div class="metric-top"><span class="metric-icon metric-icon--orange">⌘</span><span class="metric-trend">Total cadastrado</span></div><span class="metric-label">Projetos cadastrados</span><strong class="metric-value">${projects.length.toString().padStart(2, '0')}</strong><span class="metric-caption">Ideias em destaque</span></article><article class="metric-card"><div class="metric-top"><span class="metric-icon metric-icon--green">☆</span><span class="metric-trend">Seu painel</span></div><span class="metric-label">Avaliações pendentes</span><strong class="metric-value">${new EntityService('evaluations').list().filter((item) => item.status === 'pendente').length.toString().padStart(2, '0')}</strong><span class="metric-caption">Aguardando avaliação</span></article></section>
    <section class="content-grid"><article class="panel event-panel"><div class="panel-heading"><div><p class="eyebrow">AGENDA</p><h2>Próximas competições</h2></div><button class="text-link" data-page="competicoes">Ver todas <span>→</span></button></div>${competitions.length ? `<div class="event-list">${competitions.slice(0, 4).map((event) => `<div class="event-row"><span class="event-date"><b>${new Date(event.startDate).getDate()}</b><small>${new Date(event.startDate).toLocaleDateString('pt-BR', { month: 'short' })}</small></span><div class="event-info"><strong>${escapeHTML(event.name)}</strong><span>${escapeHTML(event.location ?? 'Local a definir')}</span></div><span class="status-pill">${escapeHTML(event.status ?? 'Planejada')}</span></div>`).join('')}</div>` : `<div class="empty-state"><span class="empty-illustration">◇</span><strong>Nenhum evento por aqui ainda</strong><p>Quando uma competição for cadastrada, ela aparecerá nesta agenda.</p></div>`}</article>
      <article class="panel quick-panel"><div class="panel-heading"><div><p class="eyebrow">ATALHOS</p><h2>Acesso rápido</h2></div><span class="subtle-icon">↗</span></div><div class="quick-links">${quickLinks(user).map((item) => `<button data-page="${item.page}" class="quick-link"><span class="quick-icon ${item.color}">${item.icon}</span><span><strong>${item.title}</strong><small>${item.description}</small></span><b>→</b></button>`).join('')}</div></article></section>
    <section class="bottom-banner"><div class="banner-symbol">✳</div><div><span>ROBÓTICA ESCOLAR</span><strong>Grandes ideias começam com uma pergunta.</strong><p>Inspire a próxima geração de quem transforma o mundo.</p></div><span class="banner-decoration">R</span></section>`;
  root.querySelectorAll('[data-page]').forEach((button) => button.addEventListener('click', () => document.dispatchEvent(new CustomEvent('app:navigate', { detail: button.dataset.page }))));
}

function quickLinks(user) {
  const links = [
    { page: 'competicoes', title: 'Competições', description: 'Explore os eventos', icon: '◇', color: 'violet', roles: [ROLES.ADMIN, ROLES.TEACHER] },
    { page: 'inscricoes', title: 'Inscrições', description: 'Acompanhe as equipes', icon: '▤', color: 'blue', roles: [ROLES.ADMIN, ROLES.TEACHER] },
    { page: 'projetos', title: 'Projetos', description: 'Veja ideias em destaque', icon: '⌘', color: 'orange', roles: Object.values(ROLES) },
    { page: 'avaliacoes', title: 'Avaliações', description: 'Acesse sua fila de análise', icon: '☆', color: 'green', roles: [ROLES.ADMIN, ROLES.JUDGE] },
  ];
  return links.filter((link) => link.roles.includes(user.role)).slice(0, 3);
}

function renderPlaceholder(root, page) {
  const section = sections[page] ?? sections.ajuda;
  const collection = { competicoes: 'competitions', inscricoes: 'registrations', projetos: 'projects', avaliacoes: 'evaluations' }[page];
  const count = collection ? new EntityService(collection).list().length : null;
  root.innerHTML = `<section class="page-heading"><div><p class="eyebrow">${section.eyebrow}</p><h1>${section.title}</h1><p>${section.description}</p></div><span class="page-heading-icon">${section.icon}</span></section><article class="panel module-placeholder"><span class="placeholder-icon">${section.icon}</span><p class="eyebrow">${count === null ? 'EM CONSTRUÇÃO' : 'MÓDULO PREPARADO'}</p><h2>${count === null ? 'Estamos preparando este espaço' : `${count.toString().padStart(2, '0')} registros disponíveis`}</h2><p>${count === null ? 'Este módulo estará disponível em breve.' : 'A base de persistência e os contratos de dados estão prontos para a integração deste módulo.'}</p></article>`;
}

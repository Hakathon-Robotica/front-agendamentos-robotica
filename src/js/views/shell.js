import { ROLE_LABELS, ROLES } from '../config.js';
import { initials } from '../utils/format.js';
import { escapeHTML } from '../utils/dom.js';

const nav = [
  { id: 'competicoes-publicas', label: 'Portal público', icon: '↗', roles: Object.values(ROLES) },
  { id: 'inicio', label: 'Visão geral', icon: '◫', roles: Object.values(ROLES) },
  { id: 'competicoes', label: 'Competições', icon: '◇', roles: [ROLES.ADMIN, ROLES.TEACHER] },
  { id: 'inscricoes', label: 'Equipes e inscrições', icon: '▤', roles: [ROLES.ADMIN, ROLES.TEACHER] },
  { id: 'escolas', label: 'Escolas', icon: '⌂', roles: [ROLES.ADMIN] },
  { id: 'projetos', label: 'Projetos', icon: '⌘', roles: [ROLES.ADMIN, ROLES.TEACHER, ROLES.JUDGE] },
  { id: 'avaliacoes', label: 'Avaliações', icon: '☆', roles: [ROLES.ADMIN, ROLES.JUDGE] },
];

export function renderShell({ user, page, menuOpen, onNavigate, onLogout, onToggleMenu }) {
  const sidebar = document.querySelector('#sidebar');
  const topbar = document.querySelector('#topbar');
  const visibleNav = nav.filter((item) => item.roles.includes(user.role));
  sidebar.className = `sidebar${menuOpen ? ' sidebar--open' : ''}`;
  sidebar.innerHTML = `<a class="brand" href="#inicio" data-page="inicio"><img class="brand-logo" src="src/assets/logo-joinville.png" alt="Prefeitura de Joinville"><span class="brand-copy"><strong>Robótica</strong><small>GESTÃO ESCOLAR</small></span></a>
    <div class="workspace-label">ESPAÇO DE TRABALHO</div><nav class="side-nav" aria-label="Navegação principal">${visibleNav.map((item) => `<button class="nav-link${page === item.id ? ' is-active' : ''}" data-page="${item.id}" type="button"><span class="nav-icon">${item.icon}</span>${item.label}${item.id === 'avaliacoes' && user.role === ROLES.JUDGE ? '<span class="nav-dot"></span>' : ''}</button>`).join('')}</nav>
    <div class="sidebar-bottom"><div class="help-card"><span class="help-icon">✳</span><strong>Precisa de ajuda?</strong><p>Consulte o guia da plataforma.</p><button type="button" data-page="ajuda">Acessar central <span>→</span></button></div><div class="sidebar-version"><span class="status-dot"></span> Sistema operacional <small>v1.0.0</small></div></div>`;
  topbar.innerHTML = `<button class="menu-toggle" type="button" aria-label="Abrir navegação" aria-expanded="${menuOpen}"><span></span><span></span><span></span></button><div class="breadcrumbs"><span>Workspace</span><b>/</b><strong>${nav.find((item) => item.id === page)?.label ?? 'Central de ajuda'}</strong></div><div class="topbar-actions"><button class="icon-button notification-button" type="button" aria-label="Notificações">♧<i></i></button><span class="topbar-divider"></span><button class="profile-button" type="button" aria-label="Sair da conta"><span class="avatar">${escapeHTML(initials(ROLE_LABELS[user.role]))}</span><span class="profile-copy"><strong>${ROLE_LABELS[user.role]}</strong><small>Sair da conta</small></span><span class="profile-caret">⌄</span></button></div>`;
  sidebar.querySelectorAll('[data-page]').forEach((button) => button.addEventListener('click', () => onNavigate(button.dataset.page)));
  topbar.querySelector('.menu-toggle').addEventListener('click', onToggleMenu);
  topbar.querySelector('.profile-button').addEventListener('click', onLogout);
  const backdrop = document.querySelector('#sidebar-backdrop');
  if (backdrop) { backdrop.hidden = !menuOpen; backdrop.onclick = onToggleMenu; }
}

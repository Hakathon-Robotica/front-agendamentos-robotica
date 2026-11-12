import { AuthService } from './services/auth-service.js';
import { seedDemoData } from './data/seed.js';
import { renderLogin } from './views/login.js';
import { renderShell } from './views/shell.js';
import { renderPage } from './views/pages.js';
import { renderPublicCompetitions } from './views/registrations.js';
import { showToast } from './utils/dom.js';

const state = { user: null, page: 'inicio', menuOpen: false };

function render() {
  const login = document.querySelector('#login-screen');
  const admin = document.querySelector('#admin-screen');
  if (state.page === 'competicoes-publicas') {
    admin.hidden = true;
    login.hidden = false;
    renderPublicCompetitions(login, () => { state.page = 'inicio'; render(); });
    return;
  }
  if (!state.user) {
    admin.hidden = true;
    login.hidden = false;
    renderLogin(login, async (email, password) => {
      const result = await AuthService.login(email, password);
      if (!result.ok) return showToast(result.message, 'error');
      state.user = result.user;
      state.page = 'inicio';
      render();
    }, () => { state.page = 'competicoes-publicas'; render(); });
    return;
  }
  login.hidden = true;
  admin.hidden = false;
  renderShell({ user: state.user, page: state.page, menuOpen: state.menuOpen, onNavigate: navigate, onLogout: logout, onToggleMenu: toggleMenu });
  renderPage(document.querySelector('#main-content'), state.page, state.user);
}

function navigate(page) {
  state.page = page;
  state.menuOpen = false;
  render();
  document.querySelector('#main-content')?.focus({ preventScroll: true });
}

function toggleMenu() { state.menuOpen = !state.menuOpen; render(); }
function logout() { AuthService.logout(); state.user = null; state.menuOpen = false; render(); }

seedDemoData();
state.user = AuthService.getCurrentUser();
document.addEventListener('app:navigate', (event) => navigate(event.detail));
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const dialogClose = document.querySelector('.competition-backdrop .dialog-close, .project-backdrop .dialog-close');
  if (dialogClose) dialogClose.click();
  else if (state.menuOpen) toggleMenu();
});
render();

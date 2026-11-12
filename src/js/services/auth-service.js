import { StorageService } from './storage-service.js';
import { UserService } from './user-service.js';

const SESSION_KEY = 'session';
function publicUser({ password, ...user }) { return user; }
function isActive(user) {
  const status = String(user.status ?? '').toLocaleLowerCase('pt-BR');
  return user.active !== false && user.active !== 'false' && user.ativo !== false
    && !['inactive', 'disabled', 'inativo', 'desativado', 'bloqueado'].includes(status);
}

export const AuthService = Object.freeze({
  async login(email, password) {
    try {
      const user = UserService.findByEmail(email);
      if (!user || !isActive(user) || String(user.password ?? '') !== String(password ?? '')) return { ok: false, message: 'E-mail ou senha inválidos.' };
      const session = { userId: user.id, createdAt: new Date().toISOString() };
      StorageService.set(SESSION_KEY, session);
      return { ok: true, user: publicUser(user) };
    } catch (error) {
      console.error('Não foi possível iniciar a sessão.', error);
      return { ok: false, message: 'Não foi possível acessar os usuários salvos. Atualize a página e tente novamente.' };
    }
  },
  getCurrentUser() {
    const session = StorageService.get(SESSION_KEY);
    if (!session?.userId) return null;
    const user = UserService.findById(session.userId);
    return user && isActive(user) ? publicUser(user) : null;
  },
  logout() { StorageService.remove(SESSION_KEY); },
});

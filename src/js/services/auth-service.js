import { StorageService } from './storage-service.js';
import { UserService } from './user-service.js';

const SESSION_KEY = 'session';
function publicUser({ password, ...user }) { return user; }

export const AuthService = Object.freeze({
  async login(email, password) {
    const user = UserService.findByEmail(email);
    if (!user || !user.active || user.password !== password) return { ok: false, message: 'E-mail ou senha inválidos.' };
    const session = { userId: user.id, createdAt: new Date().toISOString() };
    StorageService.set(SESSION_KEY, session);
    return { ok: true, user: publicUser(user) };
  },
  getCurrentUser() {
    const session = StorageService.get(SESSION_KEY);
    if (!session?.userId) return null;
    const user = UserService.findById(session.userId);
    return user?.active ? publicUser(user) : null;
  },
  logout() { StorageService.remove(SESSION_KEY); },
});

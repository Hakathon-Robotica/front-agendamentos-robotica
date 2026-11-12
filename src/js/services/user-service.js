import { EntityService } from './entity-service.js';

const users = new EntityService('users');

export const UserService = Object.freeze({
  list() {
    const collection = users.list();
    return Array.isArray(collection) ? collection.filter((user) => user && typeof user === 'object') : [];
  },
  findById(id) { return this.list().find((user) => user.id === id) ?? null; },
  create: (entity) => users.create(entity),
  update: (id, changes) => users.update(id, changes),
  remove: (id) => users.remove(id),
  findByEmail(email) {
    const normalizedEmail = String(email ?? '').trim().toLocaleLowerCase('pt-BR');
    if (!normalizedEmail) return null;
    return this.list().find((user) => String(user.email ?? '').trim().toLocaleLowerCase('pt-BR') === normalizedEmail) ?? null;
  },
});

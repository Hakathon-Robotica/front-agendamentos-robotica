import { EntityService } from './entity-service.js';

const users = new EntityService('users');

export const UserService = Object.freeze({
  list: () => users.list(),
  findById: (id) => users.findById(id),
  create: (entity) => users.create(entity),
  update: (id, changes) => users.update(id, changes),
  remove: (id) => users.remove(id),
  findByEmail(email) { return users.list().find((user) => user.email.toLowerCase() === email.trim().toLowerCase()) ?? null; },
});

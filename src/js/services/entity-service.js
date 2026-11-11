import { StorageService } from './storage-service.js';

/** Persistência CRUD compartilhada para coleções do domínio. Entidades precisam de id. */
export class EntityService {
  constructor(collection) { this.collection = collection; }
  list() { return StorageService.get(this.collection, []); }
  findById(id) { return this.list().find((item) => item.id === id) ?? null; }
  create(entity) {
    if (!entity?.id) throw new TypeError('A entidade precisa ter um id.');
    const items = this.list();
    if (items.some((item) => item.id === entity.id)) throw new Error(`Já existe um registro com id "${entity.id}".`);
    items.push(entity); StorageService.set(this.collection, items); return entity;
  }
  update(id, changes) {
    const items = this.list(); const index = items.findIndex((item) => item.id === id);
    if (index < 0) return null;
    items[index] = { ...items[index], ...changes, id }; StorageService.set(this.collection, items); return items[index];
  }
  remove(id) {
    const items = this.list(); const next = items.filter((item) => item.id !== id);
    if (next.length === items.length) return false;
    StorageService.set(this.collection, next); return true;
  }
}

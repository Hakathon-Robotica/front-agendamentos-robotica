import { StorageService } from '../services/storage-service.js';
import { ROLES } from '../config.js';

const demoUsers = [
  { id: 'usr-admin-001', name: 'Ana Administradora', email: 'admin@robotica.edu.br', password: 'admin123', role: ROLES.ADMIN, active: true, createdAt: '2026-01-10T12:00:00.000Z' },
  { id: 'usr-prof-001', name: 'Carlos Professor', email: 'professor@robotica.edu.br', password: 'prof123', role: ROLES.TEACHER, schoolIds: ['school-demo-001'], createdAt: '2026-01-11T12:00:00.000Z' },
  { id: 'usr-judge-001', name: 'Marina Jurada', email: 'jurado@robotica.edu.br', password: 'jurado123', role: ROLES.JUDGE, active: true, createdAt: '2026-01-12T12:00:00.000Z' },
];

/** Inicializa apenas as coleções ainda ausentes, preservando os dados do usuário. */
export function seedDemoData() {
  if (!StorageService.has('users')) StorageService.set('users', demoUsers);
  if (!StorageService.has('schools')) StorageService.set('schools', [{ id: 'school-demo-001', name: 'Escola Municipal de Tecnologia', teacherIds: ['usr-prof-001'], createdAt: '2026-01-10T12:00:00.000Z' }]);
  if (!StorageService.has('competitions')) StorageService.set('competitions', []);
  if (!StorageService.has('registrations')) StorageService.set('registrations', []);
  if (!StorageService.has('evaluations')) StorageService.set('evaluations', []);
  if (!StorageService.has('projects')) StorageService.set('projects', []);
}

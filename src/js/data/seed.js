import { StorageService } from '../services/storage-service.js';
import { ROLES } from '../config.js';
import { seedDemoCompetitions } from './demo-data.js';

const demoUsers = [
  { id: 'usr-admin-001', name: 'Ana Administradora', email: 'admin@robotica.edu.br', password: 'admin123', role: ROLES.ADMIN, active: true, createdAt: '2026-01-10T12:00:00.000Z' },
  { id: 'usr-prof-001', name: 'Carlos Professor', email: 'professor@robotica.edu.br', password: 'prof123', role: ROLES.TEACHER, active: true, createdAt: '2026-01-11T12:00:00.000Z' },
  { id: 'usr-judge-001', name: 'Marina Jurada', email: 'jurado@robotica.edu.br', password: 'jurado123', role: ROLES.JUDGE, active: true, createdAt: '2026-01-12T12:00:00.000Z' },
];

const demoSchools = [
  { id: 'sch-demo-001', name: 'Escola Estadual Monteiro Lobato', city: 'Joinville', teacherIds: ['usr-prof-001'], createdAt: '2026-01-13T12:00:00.000Z', updatedAt: '2026-01-13T12:00:00.000Z' },
  { id: 'sch-demo-002', name: 'Colégio Municipal Santos Dumont', city: 'Joinville', teacherIds: ['usr-prof-002'], createdAt: '2026-01-13T12:00:00.000Z', updatedAt: '2026-01-13T12:00:00.000Z' },
];

/** Inicializa apenas as coleções ainda ausentes, preservando os dados do usuário. */
export function seedDemoData() {
  const existingUsers = StorageService.get('users', null);
  if (!StorageService.has('users') || Array.isArray(existingUsers) && existingUsers.length === 0) StorageService.set('users', demoUsers);
  if (!StorageService.has('competitions')) StorageService.set('competitions', []);
  if (!StorageService.has('schools')) StorageService.set('schools', demoSchools);
  if (!StorageService.has('registrations')) StorageService.set('registrations', []);
  if (!StorageService.has('evaluations')) StorageService.set('evaluations', []);
  if (!StorageService.has('projects')) StorageService.set('projects', []);
  seedDemoCompetitions();
}

import { EntityService } from './entity-service.js';
import { ROLES } from '../config.js';

const schools = new EntityService('schools');
const registrations = new EntityService('registrations');
const newId = () => `sch-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export function schoolBelongsToTeacher(school, teacherId) {
  return Boolean(school && (school.teacherIds?.includes(teacherId) || school.teacherId === teacherId || school.professorId === teacherId));
}

/** Escolas que o usuário pode gerenciar: todas para administradores, as vinculadas para professores. */
export function schoolIdsFor(user) {
  if (!user) return [];
  if (user.role === ROLES.ADMIN) return schools.list().map((school) => school.id);
  if (user.role !== ROLES.TEACHER) return [];
  return [...new Set([
    ...(user.schoolIds ?? []),
    ...(user.schoolId ? [user.schoolId] : []),
    ...schools.list().filter((school) => schoolBelongsToTeacher(school, user.id)).map((school) => school.id),
  ])];
}

function validate(data, ignoreId) {
  const errors = [];
  const name = data.name?.trim();
  if (!name) errors.push('Informe o nome da escola.');
  else if (schools.list().some((school) => school.id !== ignoreId && school.name.trim().toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) errors.push('Já existe uma escola com este nome.');
  return errors;
}

export const SchoolService = Object.freeze({
  list: () => schools.list(),
  findById: (id) => schools.findById(id),
  forUser: (user) => { const ids = new Set(schoolIdsFor(user)); return schools.list().filter((school) => ids.has(school.id)); },
  create(data) {
    const errors = validate(data);
    if (errors.length) return { ok: false, errors };
    const now = new Date().toISOString();
    const school = { id: newId(), name: data.name.trim(), city: data.city?.trim() ?? '', teacherIds: data.teacherIds ?? [], createdAt: now, updatedAt: now };
    schools.create(school);
    return { ok: true, school };
  },
  update(id, data) {
    if (!schools.findById(id)) return { ok: false, errors: ['Escola não encontrada.'] };
    const errors = validate(data, id);
    if (errors.length) return { ok: false, errors };
    const school = schools.update(id, { name: data.name.trim(), city: data.city?.trim() ?? '', teacherIds: data.teacherIds ?? [], updatedAt: new Date().toISOString() });
    for (const team of registrations.list().filter((item) => item.schoolId === id)) registrations.update(team.id, { schoolName: school.name });
    return { ok: true, school };
  },
  remove(id) {
    if (registrations.list().some((item) => item.schoolId === id)) return { ok: false, errors: ['Esta escola possui equipes cadastradas e não pode ser excluída.'] };
    return schools.remove(id) ? { ok: true } : { ok: false, errors: ['Escola não encontrada.'] };
  },
});

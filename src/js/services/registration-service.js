import { EntityService } from './entity-service.js';
import { ROLES } from '../config.js';

const registrations = new EntityService('registrations');
const schools = new EntityService('schools');
const competitions = new EntityService('competitions');
const categories = new EntityService('categories');
const notices = new EntityService('notices');
const activeStatuses = new Set(['pendente', 'aprovado', 'approved']);

function numberFrom(value) {
  if (typeof value === 'number') return value;
  const match = String(value ?? '').match(/\d+/);
  return match ? Number(match[0]) : NaN;
}

function schoolBelongsToTeacher(school, teacherId) {
  return Boolean(school && (school.teacherIds?.includes(teacherId) || school.teacherId === teacherId || school.professorId === teacherId));
}

function isNoticePublished(notice) {
  return notice.published === true || notice.isPublished === true || ['publicado', 'publicada', 'published'].includes(String(notice.status ?? '').toLocaleLowerCase('pt-BR'));
}

export function getCompetitionCategories(competition) {
  if (Array.isArray(competition?.categories)) return competition.categories;
  const ids = competition?.categoryIds ?? [];
  return categories.list().filter((category) => ids.includes(category.id) && category.active !== false);
}

export function isRegistrationOpen(competition, today = new Date()) {
  if (!competition || competition.registrationsOpen === false || competition.registrationOpen === false || competition.isRegistrationOpen === false || competition.inscricoesAbertas === false || ['encerrada', 'closed', 'fechada'].includes(competition.registrationStatus) || ['encerrada', 'finalizada'].includes(competition.status)) return false;
  const publishedNotice = notices.list().some((notice) => notice.competitionId === competition.id && isNoticePublished(notice));
  if (!publishedNotice) return false;
  const openFlag = competition.registrationsOpen ?? competition.registrationOpen ?? competition.isRegistrationOpen ?? competition.inscricoesAbertas ?? true;
  if (!openFlag) return false;
  const start = competition.registrationStart ?? competition.registrationStartAt ?? competition.registrationOpensAt ?? competition.inscricoesInicio;
  const end = competition.registrationEnd ?? competition.registrationEndAt ?? competition.registrationClosesAt ?? competition.registrationDeadline ?? competition.inscricoesFim;
  if (start && today < windowDate(start, false)) return false;
  if (end && today > windowDate(end, true)) return false;
  return true;
}

function windowDate(value, endOfDay) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00'}`);
  return new Date(value);
}

export function validateTeam(competition, team) {
  const errors = [];
  if (!competition) return ['Competição não encontrada.'];
  if (!isRegistrationOpen(competition)) errors.push('As inscrições para esta competição estão encerradas.');
  const category = getCompetitionCategories(competition).find((item) => String(typeof item === 'string' ? item : item.id ?? item.name) === String(team.categoryId));
  if (getCompetitionCategories(competition).length && !category) errors.push('Selecione uma categoria válida.');
  const minMembers = Number(category?.minMembers ?? category?.teamSizeMin ?? competition.minMembers ?? competition.teamSizeMin ?? 1);
  const maxMembers = Number(category?.maxMembers ?? category?.teamSizeMax ?? competition.maxMembers ?? competition.teamSizeMax ?? competition.maxTeamSize ?? 8);
  const members = Array.isArray(team.members) ? team.members : [];
  if (members.length < minMembers || members.length > maxMembers) errors.push(`A equipe deve ter entre ${minMembers} e ${maxMembers} integrantes.`);
  const current = registrations.list().filter((item) => item.competitionId === competition.id && activeStatuses.has(item.status));
  const competitionLimit = Number(competition.registrationLimit ?? competition.maxTeams ?? competition.teamLimit);
  if (Number.isFinite(competitionLimit) && current.length >= competitionLimit) errors.push('O limite de equipes desta competição foi atingido.');
  const categoryLimit = Number(category?.maxTeams ?? category?.teamLimit);
  if (Number.isFinite(categoryLimit) && current.filter((item) => item.categoryId === team.categoryId).length >= categoryLimit) errors.push('O limite de equipes desta categoria foi atingido.');
  const minAge = Number(category?.minAge ?? category?.minAgeYears ?? category?.ageMin ?? category?.ageRange?.min ?? competition.minAge ?? competition.minAgeYears ?? competition.ageMin ?? competition.ageRange?.min);
  const maxAge = Number(category?.maxAge ?? category?.maxAgeYears ?? category?.ageMax ?? category?.ageRange?.max ?? competition.maxAge ?? competition.maxAgeYears ?? competition.ageMax ?? competition.ageRange?.max);
  const allowedGrades = category?.grades ?? category?.schoolGrades ?? category?.schoolLevels ?? category?.educationLevels ?? (category?.educationLevel ? [category.educationLevel] : null) ?? competition.schoolGrades ?? competition.allowedSchoolLevels;
  const schoolingMin = numberFrom(category?.schoolingMin ?? category?.minGrade ?? competition.minGrade);
  const schoolingMax = numberFrom(category?.schoolingMax ?? category?.maxGrade ?? competition.maxGrade);
  for (const member of members) {
    const age = ageOn(member.birthDate);
    if (!member.name?.trim() || !member.birthDate || !member.grade) errors.push('Preencha nome, data de nascimento e escolaridade de todos os integrantes.');
    else if (!Number.isFinite(age) || age < 0 || age > 25) errors.push(`Data de nascimento inválida para ${member.name}.`);
    else if ((Number.isFinite(minAge) && age < minAge) || (Number.isFinite(maxAge) && age > maxAge)) errors.push(`${member.name} não atende à faixa etária da categoria (${minAge || 0}–${Number.isFinite(maxAge) ? maxAge : 'sem limite'} anos).`);
    const grade = numberFrom(member.grade);
    if (Array.isArray(allowedGrades) && allowedGrades.length && !allowedGrades.some((allowed) => {
      const allowedNumber = numberFrom(allowed);
      return Number.isFinite(allowedNumber) && Number.isFinite(grade) ? allowedNumber === grade : String(allowed).trim().toLocaleLowerCase('pt-BR') === String(member.grade).trim().toLocaleLowerCase('pt-BR');
    })) errors.push(`${member.name}: escolaridade fora das permitidas para a categoria.`);
    if (Number.isFinite(grade) && (Number.isFinite(schoolingMin) && grade < schoolingMin || Number.isFinite(schoolingMax) && grade > schoolingMax)) errors.push(`${member.name}: escolaridade fora dos limites da competição.`);
  }
  if (!team.teamName?.trim()) errors.push('Informe o nome da equipe.');
  if (!team.schoolName?.trim()) errors.push('Informe a escola.');
  if (!team.schoolId || !schools.findById(team.schoolId)) errors.push('Selecione uma escola cadastrada.');
  return [...new Set(errors)];
}

function ageOn(birthDate, today = new Date()) {
  if (!birthDate) return NaN;
  const birth = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return NaN;
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate()) age--;
  return age;
}

export const RegistrationService = Object.freeze({
  list: () => registrations.list(),
  listSchools: () => schools.list(),
  findById: (id) => registrations.findById(id),
  create(competition, team) {
    const errors = validateTeam(competition, team);
    if (errors.length) return { ok: false, errors };
    const now = new Date().toISOString();
    const record = { ...team, id: `reg-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`, competitionId: competition.id, status: 'pendente', createdAt: now, updatedAt: now };
    registrations.create(record);
    return { ok: true, registration: record };
  },
  forReviewer(user) {
    const allowedSchools = new Set(user.role === ROLES.ADMIN ? registrations.list().map((item) => item.schoolId) : [
      ...(user.schoolIds ?? []),
      ...(user.schoolId ? [user.schoolId] : []),
      ...schools.list().filter((school) => schoolBelongsToTeacher(school, user.id)).map((school) => school.id),
    ]);
    return registrations.list().filter((item) => allowedSchools.has(item.schoolId))
      .sort((a, b) => Number(b.status === 'pendente') - Number(a.status === 'pendente'));
  },
  review(id, user, decision, note = '') {
    if (!['aprovado', 'rejeitado'].includes(decision)) return { ok: false, message: 'Decisão inválida.' };
    const record = registrations.findById(id);
    if (!record) return { ok: false, message: 'Inscrição não encontrada.' };
    const school = schools.findById(record.schoolId);
    const authorized = user.role === ROLES.ADMIN || user.role === ROLES.TEACHER && ((user.schoolIds ?? []).includes(record.schoolId) || user.schoolId === record.schoolId || schoolBelongsToTeacher(school, user.id));
    if (!authorized) return { ok: false, message: 'Você não tem acesso às inscrições desta escola.' };
    if (record.status !== 'pendente') return { ok: false, message: 'Esta inscrição já foi analisada.' };
    const updated = registrations.update(id, { status: decision, reviewedBy: user.id, reviewedAt: new Date().toISOString(), reviewNote: note.trim(), updatedAt: new Date().toISOString() });
    return { ok: true, registration: updated };
  },
  listCompetitions: () => competitions.list(),
  listNotices: () => notices.list(),
  listCategories: () => categories.list(),
});

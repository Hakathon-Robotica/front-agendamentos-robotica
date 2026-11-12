/**
 * Contratos documentais da API compartilhada (datas ISO 8601 em UTC).
 * Toda entidade persistida possui id string estável, createdAt e, quando editável, updatedAt.
 * Campos opcionais podem ser omitidos quando ainda não forem conhecidos.
 *
 * User: { id, name, email, password, role: 'administrador'|'professor'|'jurado', active, createdAt }
 * Session: { userId, createdAt }
 * Competition: { id, name, description?, location?, startDate, endDate?, status: 'planejada'|'ativa'|'encerrada', createdAt, updatedAt? }
 * Registration: { id, competitionId, categoryId, teamName, schoolId, schoolName, teacherId, members: Array<{ id, name, birthDate, grade }>, status: 'pendente'|'aprovado'|'rejeitado', reviewedBy?, reviewedAt?, reviewNote?, createdAt, updatedAt? }
 * Project: { id, registrationId?, competitionId?, schoolId?, schoolName?, teamName?, title, summary?, technicalDescription?, category?, year, objectives?, technologies: string[], development?, challenges?, solutions?, lessonsLearned?, imageData? (PNG/JPEG/WebP data URL up to 200 KB), imageUrl?, visibility: 'public'|'private', createdBy, createdAt, updatedAt? }
 * Evaluation: { id, projectId, judgeId, scores: Record<string, number>, comments?, status: 'pendente'|'concluida', createdAt, updatedAt? }
 *
 * Coleções LocalStorage: users, schools, competitions, categories, notices, registrations, projects, evaluations, session.
 * Relacionamentos usam IDs, nunca cópias embutidas da entidade relacionada.
 */

export const DATA_CONTRACTS = Object.freeze({
  collections: Object.freeze(['users', 'schools', 'competitions', 'categories', 'notices', 'registrations', 'projects', 'evaluations']),
  entityIdField: 'id',
  dateFormat: 'ISO-8601 UTC',
  relationships: Object.freeze({ registration: ['competitionId', 'categoryId', 'schoolId', 'teacherId'], project: ['registrationId', 'competitionId', 'schoolId'], evaluation: ['projectId', 'judgeId'] }),
});

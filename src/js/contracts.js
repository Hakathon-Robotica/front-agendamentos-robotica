/**
 * Contratos documentais da API compartilhada (datas ISO 8601 em UTC).
 * Toda entidade persistida possui id string estável, createdAt e, quando editável, updatedAt.
 * Campos opcionais podem ser omitidos quando ainda não forem conhecidos.
 *
 * User: { id, name, email, password, role: 'administrador'|'professor'|'jurado', active, createdAt }
 * Session: { userId, createdAt }
 * Competition: { id, name, description?, location?, startDate, endDate?, status: 'planejada'|'ativa'|'encerrada', createdAt, updatedAt? }
 * School: { id, name, teacherIds: string[], createdAt }
 * Registration/team: { id, competitionId, categoryId?, projectId?, teamName, schoolId, schoolName, teacherId?, members: Array<{ id, name, birthDate, grade }>, status: 'pendente'|'aprovado'|'rejeitado', createdAt, updatedAt?, reviewedBy?, reviewedAt?, reviewNote? }
 * Project: { id, registrationId, name, summary?, category?, members: Array<{ name, grade? }>, createdAt, updatedAt? }
 * Evaluation: { id, projectId, judgeId, scores: Record<string, number>, comments?, status: 'pendente'|'concluida', createdAt, updatedAt? }
 *
 * Coleções LocalStorage: users, competitions, registrations, projects, evaluations, session.
 * Relacionamentos usam IDs, nunca cópias embutidas da entidade relacionada.
 */

export const DATA_CONTRACTS = Object.freeze({
  collections: Object.freeze(['users', 'schools', 'competitions', 'registrations', 'projects', 'evaluations']),
  entityIdField: 'id',
  dateFormat: 'ISO-8601 UTC',
  relationships: Object.freeze({ registration: ['competitionId', 'categoryId', 'projectId', 'schoolId', 'teacherId'], school: ['teacherIds'], project: ['registrationId'], evaluation: ['projectId', 'judgeId'] }),
});

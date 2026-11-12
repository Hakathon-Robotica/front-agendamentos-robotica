import { EntityService } from './entity-service.js';
import { ROLES } from '../config.js';

const evaluations = new EntityService('evaluations');
const registrations = new EntityService('registrations');

export const CRITERIA = Object.freeze([
  { id: 'desempenho', label: 'Desempenho', hint: 'Resultado do robô na prova ou desafio' },
  { id: 'inovacao', label: 'Projeto e inovação', hint: 'Criatividade, solução técnica e construção' },
  { id: 'apresentacao', label: 'Apresentação', hint: 'Clareza ao explicar o projeto' },
  { id: 'equipe', label: 'Trabalho em equipe', hint: 'Colaboração e participação de todos' },
]);

const approved = (team) => ['aprovado', 'approved'].includes(team.status);
const round = (value) => Math.round(value * 100) / 100;

export function averageOf(evaluation) {
  const values = CRITERIA.map((criterion) => Number(evaluation?.scores?.[criterion.id])).filter(Number.isFinite);
  return values.length === CRITERIA.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

export const EvaluationService = {
  teamsToEvaluate(competitionId = null) {
    return registrations.list().filter((team) => approved(team) && (!competitionId || team.competitionId === competitionId));
  },
  forTeam(teamId) {
    return evaluations.list().filter((item) => item.registrationId === teamId && averageOf(item) !== null);
  },
  byJudge(teamId, judgeId) {
    return evaluations.list().find((item) => item.registrationId === teamId && item.judgeId === judgeId) ?? null;
  },
  summary(teamId) {
    const items = this.forTeam(teamId);
    if (!items.length) return { count: 0, average: null, criteria: {} };
    const criteria = Object.fromEntries(CRITERIA.map((criterion) => [criterion.id, round(items.reduce((sum, item) => sum + Number(item.scores[criterion.id]), 0) / items.length)]));
    return { count: items.length, average: round(items.reduce((sum, item) => sum + averageOf(item), 0) / items.length), criteria };
  },
  pendingFor(user) {
    const teams = this.teamsToEvaluate();
    if (user.role === ROLES.JUDGE) return teams.filter((team) => !this.byJudge(team.id, user.id)).length;
    return teams.filter((team) => !this.forTeam(team.id).length).length;
  },
  save(teamId, user, { scores = {}, comments = '' }) {
    if (user?.role !== ROLES.JUDGE) return { ok: false, errors: ['Apenas jurados podem lançar notas.'] };
    const team = registrations.findById(teamId);
    if (!team || !approved(team)) return { ok: false, errors: ['Somente equipes aprovadas podem ser avaliadas.'] };
    const errors = [];
    const clean = {};
    for (const criterion of CRITERIA) {
      const raw = scores[criterion.id];
      const value = Number(String(raw ?? '').replace(',', '.'));
      if (raw === '' || raw === null || raw === undefined || !Number.isFinite(value) || value < 0 || value > 10) errors.push(`${criterion.label}: informe uma nota entre 0 e 10.`);
      else clean[criterion.id] = round(value);
    }
    if (errors.length) return { ok: false, errors };
    const now = new Date().toISOString();
    const data = { scores: clean, average: averageOf({ scores: clean }), comments: comments.trim(), status: 'concluida', updatedAt: now };
    const existing = this.byJudge(teamId, user.id);
    const evaluation = existing
      ? evaluations.update(existing.id, data)
      : evaluations.create({ id: `eval-${crypto.randomUUID?.() ?? Date.now()}`, registrationId: team.id, competitionId: team.competitionId, categoryId: team.categoryId, judgeId: user.id, createdAt: now, ...data });
    return { ok: true, evaluation };
  },
};

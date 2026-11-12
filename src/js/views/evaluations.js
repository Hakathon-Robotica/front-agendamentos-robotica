import { EntityService } from '../services/entity-service.js';
import { getCompetitionCategories } from '../services/registration-service.js';
import { CRITERIA, EvaluationService, averageOf } from '../services/evaluation-service.js';
import { ROLES } from '../config.js';
import { escapeHTML, showToast } from '../utils/dom.js';

const safe = (value) => escapeHTML(value ?? '');
const competitions = new EntityService('competitions');
const formatScore = (value) => value === null || value === undefined ? '—' : Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const categoriesOf = (competition) => getCompetitionCategories(competition).map((item) => typeof item === 'string' ? { id: item, name: item } : { id: item.id ?? item.name, name: item.name ?? item.title ?? item.id });
const filters = { competitionId: '', categoryId: '' };

export function renderEvaluations(root, user) {
  const isJudge = user.role === ROLES.JUDGE;
  const withTeams = competitions.list().filter((competition) => EvaluationService.teamsToEvaluate(competition.id).length);
  if (!withTeams.some((competition) => competition.id === filters.competitionId)) { filters.competitionId = withTeams[0]?.id ?? ''; filters.categoryId = ''; }
  const competition = competitions.findById(filters.competitionId);
  const allTeams = EvaluationService.teamsToEvaluate(filters.competitionId);
  const categories = categoriesOf(competition).filter((category) => allTeams.some((team) => String(team.categoryId) === String(category.id)));
  const extra = [...new Set(allTeams.map((team) => String(team.categoryId)))].filter((id) => !categories.some((category) => String(category.id) === id)).map((id) => ({ id, name: id }));
  const categoryList = [...categories, ...extra];
  if (!categoryList.some((category) => String(category.id) === filters.categoryId)) filters.categoryId = String(categoryList[0]?.id ?? '');
  const teams = allTeams.filter((team) => String(team.categoryId) === filters.categoryId)
    .map((team) => ({ team, summary: EvaluationService.summary(team.id), mine: EvaluationService.byJudge(team.id, user.id) }))
    .sort((a, b) => isJudge ? Number(Boolean(a.mine)) - Number(Boolean(b.mine)) || a.team.teamName.localeCompare(b.team.teamName, 'pt-BR') : (b.summary.average ?? -1) - (a.summary.average ?? -1));
  const done = teams.filter((item) => isJudge ? item.mine : item.summary.count).length;
  const draw = () => renderEvaluations(root, user);

  root.innerHTML = `<section class="page-heading"><div><p class="eyebrow">JULGAMENTO</p><h1>${isJudge ? 'Notas das equipes' : 'Classificação'}</h1><p>${isJudge ? 'Avalie as equipes de cada categoria com notas de 0 a 10 em cada critério.' : 'Acompanhe as médias lançadas pelos jurados em cada categoria.'}</p></div><span class="page-heading-icon">☆</span></section>
    ${withTeams.length ? `<div class="eval-filters">
      <label>Competição<select data-filter="competitionId">${withTeams.map((item) => `<option value="${safe(item.id)}" ${item.id === filters.competitionId ? 'selected' : ''}>${safe(item.name)}</option>`).join('')}</select></label>
      <div class="eval-tabs" role="tablist" aria-label="Categorias">${categoryList.map((category) => `<button type="button" role="tab" class="competition-tab${String(category.id) === filters.categoryId ? ' is-active' : ''}" aria-selected="${String(category.id) === filters.categoryId}" data-category="${safe(category.id)}">${safe(category.name)}</button>`).join('')}</div>
    </div>
    <div class="team-toolbar"><span>${done.toString().padStart(2, '0')} de ${teams.length.toString().padStart(2, '0')} equipe${teams.length === 1 ? '' : 's'} ${isJudge ? 'avaliada' : 'com nota'}${teams.length === 1 ? '' : 's'}</span></div>
    <div class="approval-list">${teams.map((item, index) => evaluationCard(item, index, isJudge)).join('')}</div>`
    : `<article class="panel module-placeholder"><span class="placeholder-icon">☆</span><p class="eyebrow">AVALIAÇÕES</p><h2>Nenhuma equipe para avaliar</h2><p>As equipes aparecem aqui depois que a inscrição é aprovada.</p></article>`}
    <div class="team-modal-host"></div>`;

  root.querySelector('[data-filter="competitionId"]')?.addEventListener('change', (event) => { filters.competitionId = event.target.value; filters.categoryId = ''; draw(); });
  root.querySelectorAll('[data-category]').forEach((button) => button.addEventListener('click', () => { filters.categoryId = button.dataset.category; draw(); }));
  root.querySelectorAll('[data-action="evaluate"]').forEach((button) => button.addEventListener('click', () => openEvaluationDialog(root, teams.find((item) => item.team.id === button.dataset.id).team, user, draw)));
}

function evaluationCard({ team, summary, mine }, index, isJudge) {
  const members = (team.members ?? []).length;
  const tag = isJudge
    ? (mine ? `<span class="pending-tag status-aprovado">NOTA ${formatScore(averageOf(mine))}</span>` : '<span class="pending-tag">PENDENTE</span>')
    : `<span class="eval-rank">${summary.count ? `${index + 1}º` : '—'}</span>`;
  const criteria = isJudge ? mine?.scores : summary.criteria;
  const breakdown = criteria && Object.keys(criteria).length
    ? `<div class="eval-breakdown">${CRITERIA.map((criterion) => `<span><b>${safe(criterion.label)}</b>${formatScore(criteria[criterion.id])}</span>`).join('')}</div>` : '';
  const footer = isJudge
    ? `<div class="team-card-actions"><button class="button ${mine ? 'button--subtle' : 'button--primary'}" type="button" data-action="evaluate" data-id="${safe(team.id)}">${mine ? 'Editar notas' : 'Avaliar equipe'}</button></div>`
    : `<div class="eval-average"><span>Média final</span><strong>${formatScore(summary.average)}</strong><small>${summary.count} jurado${summary.count === 1 ? '' : 's'}</small></div>`;
  return `<article class="panel approval-card"><div class="approval-heading"><div><p class="eyebrow">${safe(team.schoolName ?? 'Escola não informada')}</p><h2>${safe(team.teamName)}</h2></div>${tag}</div>
    <div class="approval-meta"><span><b>Integrantes</b>${members}</span><span><b>${isJudge ? 'Sua média' : 'Avaliações'}</b>${isJudge ? formatScore(mine ? averageOf(mine) : null) : summary.count}</span></div>${breakdown}${footer}</article>`;
}

function openEvaluationDialog(root, team, user, onSaved) {
  const current = EvaluationService.byJudge(team.id, user.id);
  const host = root.querySelector('.team-modal-host');
  host.innerHTML = `<div class="competition-backdrop"><section class="competition-dialog" role="dialog" aria-modal="true" aria-labelledby="eval-dialog-title"><div class="dialog-heading"><div><p class="eyebrow">AVALIAÇÃO</p><h2 id="eval-dialog-title">${safe(team.teamName)}</h2></div><button type="button" class="dialog-close" aria-label="Fechar">×</button></div>
    <form class="competition-form eval-form" novalidate>
      ${CRITERIA.map((criterion) => `<label class="eval-criterion"><span><strong>${safe(criterion.label)}</strong><small>${safe(criterion.hint)}</small></span><input name="${criterion.id}" type="number" inputmode="decimal" min="0" max="10" step="0.1" required placeholder="0 a 10" value="${safe(current?.scores?.[criterion.id])}"></label>`).join('')}
      <div class="eval-live"><span>Média</span><strong>${formatScore(current ? averageOf(current) : null)}</strong></div>
      <label>Observações (opcional)<textarea name="comments" rows="3" maxlength="600">${safe(current?.comments)}</textarea></label>
      <div class="form-errors" aria-live="polite"></div>
      <div class="dialog-actions"><button type="button" class="button button--subtle dialog-cancel">Cancelar</button><button class="button button--primary" type="submit">Salvar notas</button></div>
    </form></section></div>`;
  const form = host.querySelector('form');
  const close = () => { host.innerHTML = ''; };
  const read = () => {
    const data = new FormData(form);
    return { scores: Object.fromEntries(CRITERIA.map((criterion) => [criterion.id, data.get(criterion.id)])), comments: data.get('comments') ?? '' };
  };
  host.querySelector('.dialog-close').addEventListener('click', close);
  host.querySelector('.dialog-cancel').addEventListener('click', close);
  host.querySelector('.competition-backdrop').addEventListener('click', (event) => { if (event.target === event.currentTarget) close(); });
  form.addEventListener('input', () => {
    const values = CRITERIA.map((criterion) => form.elements[criterion.id].value).filter((value) => value !== '').map(Number);
    form.querySelector('.eval-live strong').textContent = values.length === CRITERIA.length && values.every(Number.isFinite) ? formatScore(values.reduce((sum, value) => sum + value, 0) / values.length) : '—';
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = EvaluationService.save(team.id, user, read());
    if (!result.ok) { form.querySelector('.form-errors').innerHTML = `<ul>${result.errors.map((message) => `<li>${safe(message)}</li>`).join('')}</ul>`; return; }
    close();
    showToast('Notas salvas.');
    onSaved();
  });
  form.elements[CRITERIA[0].id].focus();
}

import { RegistrationService, canManageSchool, getCompetitionCategories, isRegistrationOpen } from '../services/registration-service.js';
import { SchoolService } from '../services/school-service.js';
import { ROLES } from '../config.js';
import { escapeHTML, showToast } from '../utils/dom.js';
import { formatDate } from '../utils/format.js';

const safe = (value) => escapeHTML(value ?? '');
const safeUrl = (value) => {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  return /^(https?:\/\/|\/|\.\/|\.\.\/)/i.test(trimmed) ? safe(trimmed) : '';
};
const categoriesOf = (competition) => getCompetitionCategories(competition).map((item) => typeof item === 'string' ? { id: item, name: item } : { ...item, id: item.id ?? item.name, name: item.name ?? item.title ?? item.id });

export function renderPublicCompetitions(root, onBack) {
  root.className = 'public-screen';
  const competitions = RegistrationService.listCompetitions();
  const schools = RegistrationService.listSchools();
  root.innerHTML = `<header class="public-header"><a class="brand" href="#" id="public-back"><img class="brand-logo" src="src/assets/logo-joinville.png" alt="Prefeitura de Joinville"><span class="brand-copy"><strong>Robótica</strong><small>GESTÃO ESCOLAR</small></span></a><span>PORTAL DE COMPETIÇÕES</span><button class="button button--outline" id="public-login" type="button">Acesso da organização</button></header>
    <main class="public-main"><div class="public-intro"><p class="eyebrow">PARTICIPE · CRIE · INOVE</p><h1>Competições para<br>ideias em movimento.</h1><p>Consulte os editais, conheça as categorias e inscreva sua equipe.</p></div>
      ${competitions.length ? `<div class="public-competition-list">${competitions.map((competition) => publicCompetitionCard(competition, schools)).join('')}</div>` : `<article class="panel public-empty"><span class="placeholder-icon">◇</span><h2>Novas competições em breve</h2><p>Quando os eventos forem publicados, eles aparecerão nesta página.</p></article>`}
      <p class="public-note">As inscrições enviadas ficam pendentes até a análise do professor responsável pela escola.</p></main>`;
  root.querySelector('#public-back').addEventListener('click', (event) => { event.preventDefault(); onBack(); });
  root.querySelector('#public-login').addEventListener('click', onBack);
  root.querySelectorAll('[data-open-form]').forEach((button) => button.addEventListener('click', () => {
    const form = root.querySelector(`#team-form-${CSS.escape(button.dataset.openForm)}`);
    form.hidden = !form.hidden;
    if (!form.hidden) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }));
  root.querySelectorAll('.team-form').forEach((form) => wireTeamForm(form, schools, () => renderPublicCompetitions(root, onBack)));
}

function publicCompetitionCard(competition, schools) {
  const categories = categoriesOf(competition);
  const open = isRegistrationOpen(competition);
  const notice = RegistrationService.listNotices().find((item) => item.competitionId === competition.id && isNoticePublished(item));
  const edict = competition.edictUrl ?? competition.edictURL ?? competition.noticeUrl ?? competition.editalUrl ?? competition.edital ?? competition.documents?.edictUrl ?? notice?.url ?? notice?.fileUrl ?? notice?.documentUrl;
  const edictHref = safeUrl(edict);
  const inlineEdict = typeof competition.edital === 'string' && !safeUrl(competition.edital) ? competition.edital
    : competition.edictContent ?? competition.edictText ?? competition.editalContent ?? competition.noticeContent ?? competition.notice?.summary ?? '';
  return `<article class="public-event-card"><div class="public-event-top"><span class="public-event-mark">◇</span><span class="${open ? 'open-tag' : 'closed-tag'}">${open ? 'INSCRIÇÕES ABERTAS' : 'INSCRIÇÕES ENCERRADAS'}</span></div><h2>${safe(competition.name ?? 'Competição escolar')}</h2><p>${safe(competition.description ?? 'Uma oportunidade para aprender, colaborar e apresentar novas ideias.')}</p><div class="public-event-facts"><span>⌖ &nbsp;${safe(competition.location ?? 'Local a definir')}</span><span>▦ &nbsp;${competition.startDate ? safe(formatDate(competition.startDate)) : 'Data a definir'}</span></div>
    <details class="competition-details" open><summary>Edital e categorias</summary><div class="details-content">${edictHref ? `<a class="edict-link" href="${edictHref}" target="_blank" rel="noopener noreferrer">↗ Consultar edital</a>` : notice ? `<div class="public-edict"><strong>${safe(notice.title || 'Edital publicado')}</strong><p>${safe(notice.summary ?? notice.content ?? notice.description ?? '')}</p></div>` : inlineEdict ? `<div class="public-edict"><strong>Edital</strong><p>${safe(inlineEdict)}</p></div>` : '<span class="muted-copy">Edital ainda não disponibilizado.</span>'}<strong>Categorias</strong>${categories.length ? `<ul>${categories.map((category) => `<li><b>${safe(category.name)}</b>${category.description ? ` — ${safe(category.description)}` : ''}${category.minAge != null || category.maxAge != null ? `<small>Idade: ${safe(category.minAge ?? '—')} a ${safe(category.maxAge ?? '—')} anos</small>` : ''}${category.minMembers != null || category.maxMembers != null ? `<small>Equipe: ${safe(category.minMembers ?? '—')} a ${safe(category.maxMembers ?? '—')} integrantes</small>` : ''}${category.schoolingMin || category.schoolingMax ? `<small>Escolaridade: ${safe(category.schoolingMin || '—')} a ${safe(category.schoolingMax || '—')}</small>` : ''}</li>`).join('')}</ul>` : '<span class="muted-copy">As categorias serão divulgadas pela organização.</span>'}</div></details>
    ${open ? `<button class="button button--primary public-register-button" type="button" data-open-form="${safe(competition.id)}">Inscrever uma equipe <span>→</span></button><form class="team-form" id="team-form-${safe(competition.id)}" data-competition="${safe(competition.id)}" hidden>${teamFormFields(competition, schools)}<button class="button button--primary" type="submit">Enviar inscrição</button><p class="form-hint">A equipe ficará com status pendente até a aprovação do professor da escola.</p></form>` : ''}</article>`;
}

function isNoticePublished(notice) {
  return notice.published === true || notice.isPublished === true || ['publicado', 'publicada', 'published'].includes(String(notice.status ?? '').toLocaleLowerCase('pt-BR'));
}

function teamFormFields(competition, schools, team = {}) {
  const categories = categoriesOf(competition);
  const members = team.members?.length ? team.members : [{}];
  return `<h3>Dados da equipe</h3><label>Nome da equipe<input name="teamName" required maxlength="80" placeholder="Ex.: Robôs do Futuro" value="${safe(team.teamName)}"></label>
    ${categories.length ? `<label>Categoria<select name="categoryId" required><option value="">Selecione uma categoria</option>${categories.map((category) => `<option value="${safe(category.id)}" ${String(category.id) === String(team.categoryId) ? 'selected' : ''}>${safe(category.name)}</option>`).join('')}</select></label>` : '<input type="hidden" name="categoryId" value="geral">'}
    <label>Escola<select name="schoolId" required ${schools.length ? '' : 'disabled'}><option value="">${schools.length ? 'Selecione a escola' : 'Nenhuma escola cadastrada'}</option>${schools.map((school) => `<option value="${safe(school.id)}" ${school.id === team.schoolId || schools.length === 1 && !team.schoolId ? 'selected' : ''}>${safe(school.name)}</option>`).join('')}</select></label>
    <div class="members-heading"><strong>Integrantes</strong><button class="text-link" type="button" data-add-member>+ Adicionar integrante</button></div><div class="member-fields">${members.map((member, index) => memberFields(index, member)).join('')}</div><div class="form-errors" aria-live="polite"></div>`;
}

function memberFields(index, member = {}) {
  return `<div class="member-field" data-member-index="${index}"><input type="hidden" name="memberId" value="${safe(member.id)}"><div class="member-field-title"><strong>Integrante ${index + 1}</strong>${index ? `<button type="button" class="remove-member" aria-label="Remover integrante">Remover</button>` : ''}</div><label>Nome completo<input name="memberName" required maxlength="100" placeholder="Nome do estudante" value="${safe(member.name)}"></label><div class="member-input-row"><label>Data de nascimento<input name="memberBirthDate" type="date" required value="${safe(member.birthDate)}"></label><label>Ano escolar<input name="memberGrade" required maxlength="35" placeholder="Ex.: 8º ano" value="${safe(member.grade)}"></label></div></div>`;
}

function wireMemberButtons(form) {
  form.addEventListener('click', (event) => {
    if (event.target.closest('[data-add-member]')) form.querySelector('.member-fields').insertAdjacentHTML('beforeend', memberFields(form.querySelectorAll('.member-field').length));
    if (event.target.closest('.remove-member')) {
      event.target.closest('.member-field').remove();
      form.querySelectorAll('.member-field').forEach((field, index) => { field.dataset.memberIndex = index; field.querySelector('.member-field-title strong').textContent = `Integrante ${index + 1}`; });
    }
  });
}

function readTeam(form) {
  const data = new FormData(form);
  const ids = data.getAll('memberId');
  const births = data.getAll('memberBirthDate');
  const grades = data.getAll('memberGrade');
  return {
    teamName: data.get('teamName')?.trim(), categoryId: data.get('categoryId'), schoolId: data.get('schoolId') || null,
    members: data.getAll('memberName').map((name, index) => ({ id: ids[index] || `member-${Date.now()}-${index}`, name: name.trim(), birthDate: births[index], grade: grades[index].trim() })),
  };
}

function showErrors(form, errors) {
  form.querySelector('.form-errors').innerHTML = `<ul>${errors.map((message) => `<li>${safe(message)}</li>`).join('')}</ul>`;
}

function wireTeamForm(form, schools, onSuccess) {
  wireMemberButtons(form);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const competition = RegistrationService.listCompetitions().find((item) => item.id === form.dataset.competition);
    const result = RegistrationService.create(competition, readTeam(form));
    if (!result.ok) { showErrors(form, result.errors); return; }
    showToast('Inscrição enviada para análise do professor.');
    onSuccess();
  });
}

export function renderRegistrationManagement(root, user) {
  const rows = RegistrationService.forReviewer(user);
  const mySchools = SchoolService.forUser(user);
  const draw = () => renderRegistrationManagement(root, user);
  root.innerHTML = `<section class="page-heading"><div><p class="eyebrow">EQUIPES · CADASTRO E REVISÃO</p><h1>Inscrições</h1><p>Cadastre equipes e analise as inscrições recebidas nas competições.</p></div><span class="page-heading-icon">▤</span></section>
    ${user.role === ROLES.TEACHER && !mySchools.length ? `<div class="panel access-note">Seu perfil ainda não está vinculado a uma escola. Solicite à organização o vínculo da sua conta para cadastrar equipes e acessar as inscrições.</div>` : ''}
    ${mySchools.length ? `<div class="team-toolbar"><span>${rows.length.toString().padStart(2, '0')} equipe${rows.length === 1 ? '' : 's'}</span><button class="button button--primary" type="button" data-action="new-team">+ Cadastrar equipe</button></div>` : ''}
    ${rows.length ? `<div class="approval-list">${rows.map((team) => approvalCard(team, user)).join('')}</div>` : `<article class="panel module-placeholder"><span class="placeholder-icon">✓</span><p class="eyebrow">EQUIPES</p><h2>Nenhuma equipe encontrada</h2><p>Cadastre uma equipe ou aguarde as inscrições enviadas pelo portal público.</p></article>`}
    <div class="team-modal-host"></div>`;
  root.querySelector('[data-action="new-team"]')?.addEventListener('click', () => openTeamDialog(root, user, null, draw));
  root.querySelectorAll('[data-action="edit-team"]').forEach((button) => button.addEventListener('click', () => openTeamDialog(root, user, button.dataset.id, draw)));
  root.querySelectorAll('[data-action="delete-team"]').forEach((button) => button.addEventListener('click', () => {
    const team = RegistrationService.findById(button.dataset.id);
    if (!team || !window.confirm(`Excluir a equipe "${team.teamName}"? Esta ação não pode ser desfeita.`)) return;
    const result = RegistrationService.remove(team.id, user);
    if (!result.ok) { showToast(result.message, 'error'); return; }
    showToast('Equipe excluída.');
    draw();
  }));
  root.querySelectorAll('.review-form').forEach((form) => form.addEventListener('submit', (event) => {
    event.preventDefault();
    const decision = event.submitter?.value;
    const result = RegistrationService.review(form.dataset.id, user, decision, new FormData(form).get('reviewNote'));
    if (!result.ok) { showToast(result.message, 'error'); return; }
    showToast(`Inscrição ${decision === 'aprovado' ? 'aprovada' : 'rejeitada'}.`);
    draw();
  }));
}

function openTeamDialog(root, user, teamId, onSaved) {
  const team = teamId ? RegistrationService.findById(teamId) : null;
  const schools = SchoolService.forUser(user);
  const allCompetitions = RegistrationService.listCompetitions();
  const competitionsAvailable = team ? allCompetitions.filter((item) => item.id === team.competitionId) : allCompetitions.filter((item) => isRegistrationOpen(item));
  const host = root.querySelector('.team-modal-host');
  host.innerHTML = `<div class="competition-backdrop"><section class="competition-dialog team-dialog" role="dialog" aria-modal="true" aria-labelledby="team-dialog-title"><div class="dialog-heading"><div><p class="eyebrow">EQUIPES</p><h2 id="team-dialog-title">${team ? 'Editar equipe' : 'Cadastrar equipe'}</h2></div><button type="button" class="dialog-close" aria-label="Fechar">×</button></div>
    ${competitionsAvailable.length ? `<form class="team-form team-form--dialog"><label>Competição<select name="competitionId" required ${team ? 'disabled' : ''}>${competitionsAvailable.map((item) => `<option value="${safe(item.id)}">${safe(item.name)}</option>`).join('')}</select></label><div class="team-form-body"></div><div class="dialog-actions"><button type="button" class="button button--subtle dialog-cancel">Cancelar</button><button class="button button--primary" type="submit">${team ? 'Salvar alterações' : 'Cadastrar equipe'}</button></div><p class="form-hint">${team ? 'As regras da categoria são validadas novamente ao salvar.' : 'Equipes cadastradas pela escola já entram aprovadas.'}</p></form>`
    : `<p class="form-hint">Nenhuma competição está com inscrições abertas. Publique o edital e abra as inscrições em Competições.</p><div class="dialog-actions"><button type="button" class="button button--subtle dialog-cancel">Fechar</button></div>`}</section></div>`;
  const close = () => { host.innerHTML = ''; };
  host.querySelector('.dialog-close').addEventListener('click', close);
  host.querySelector('.dialog-cancel').addEventListener('click', close);
  host.querySelector('.competition-backdrop').addEventListener('click', (event) => { if (event.target === event.currentTarget) close(); });
  const form = host.querySelector('form');
  if (!form) return;
  const select = form.querySelector('[name="competitionId"]');
  const body = form.querySelector('.team-form-body');
  const drawBody = (values) => { body.innerHTML = teamFormFields(allCompetitions.find((item) => item.id === select.value), schools, values); };
  drawBody(team ?? {});
  select.addEventListener('change', () => drawBody({ ...readTeam(form), categoryId: '' }));
  wireMemberButtons(form);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const values = readTeam(form);
    const result = team ? RegistrationService.update(team.id, values, user) : RegistrationService.create(allCompetitions.find((item) => item.id === select.value), values, user);
    if (!result.ok) { showErrors(form, result.errors); return; }
    close();
    showToast(team ? 'Equipe atualizada.' : 'Equipe cadastrada com sucesso.');
    onSaved();
  });
}

function approvalCard(team, user) {
  const competition = RegistrationService.listCompetitions().find((item) => item.id === team.competitionId);
  const status = team.status ?? 'pendente';
  const statusLabel = { pendente: 'PENDENTE', aprovado: 'APROVADO', approved: 'APROVADO', rejeitado: 'REJEITADO', rejected: 'REJEITADO' }[status] ?? safe(String(status).toUpperCase());
  const manage = canManageSchool(user, team.schoolId) ? `<div class="team-card-actions">${status !== 'rejeitado' ? `<button class="button button--subtle" type="button" data-action="edit-team" data-id="${safe(team.id)}">Editar</button>` : ''}<button class="icon-danger" type="button" data-action="delete-team" data-id="${safe(team.id)}" aria-label="Excluir equipe ${safe(team.teamName)}">Excluir</button></div>` : '';
  const review = status === 'pendente' ? `<form class="review-form" data-id="${safe(team.id)}"><label>Observação opcional<input name="reviewNote" maxlength="240" placeholder="Orientação para a equipe"></label><div class="review-actions"><button class="button button--reject" name="decision" value="rejeitado" type="submit">Rejeitar</button><button class="button button--approve" name="decision" value="aprovado" type="submit">Aprovar equipe</button></div></form>` : `<div class="review-result"><strong>${statusLabel}</strong>${team.reviewNote ? `<p>${safe(team.reviewNote)}</p>` : ''}</div>`;
  return `<article class="panel approval-card"><div class="approval-heading"><div><p class="eyebrow">${safe(competition?.name ?? 'Competição')}</p><h2>${safe(team.teamName)}</h2></div><span class="pending-tag status-${safe(status)}">${statusLabel}</span></div><div class="approval-meta"><span><b>Escola</b>${safe(team.schoolName)}</span><span><b>Categoria</b>${safe(categoriesOf(competition ?? {}).find((item) => String(item.id) === String(team.categoryId))?.name ?? team.categoryId ?? 'Geral')}</span><span><b>Enviada</b>${safe(formatDate(team.createdAt))}</span><span><b>Origem</b>${team.createdBy ? 'Cadastro da escola' : 'Portal público'}</span></div><div class="approval-members"><strong>Integrantes (${team.members?.length ?? 0})</strong><div>${(team.members ?? []).map((member) => `<span>${safe(member.name)} <small>${safe(member.grade)} · ${safe(formatDate(member.birthDate))}</small></span>`).join('')}</div></div>${review}${manage}</article>`;
}

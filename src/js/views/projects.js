import { EntityService } from '../services/entity-service.js';
import { ROLES } from '../config.js';
import { escapeHTML, showToast } from '../utils/dom.js';
import { formatDate } from '../utils/format.js';

const projects = new EntityService('projects');
const registrations = new EntityService('registrations');
const competitions = new EntityService('competitions');
const evaluations = new EntityService('evaluations');
const schools = new EntityService('schools');
const categories = new EntityService('categories');
const safe = (value) => escapeHTML(value ?? '');
const id = () => globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const imageLimit = 200 * 1024;

export function renderProjects(root, user) {
  let tab = 'library';
  let query = '';
  let categoryFilter = '';
  let yearFilter = '';
  let visibilityFilter = '';

  const draw = () => {
    const allProjects = projects.list().filter((project) => canView(project, user));
    const categories = [...new Set(allProjects.map(projectCategory).filter(Boolean))].sort();
    const years = [...new Set(allProjects.map((project) => String(project.year ?? '')).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const filtered = allProjects.filter((project) => {
      const team = teamFor(project);
      const text = [project.title, project.name, project.summary, project.description, project.technicalDescription, project.objectives, project.development, project.challenges, project.solutions, project.lessonsLearned, project.schoolName, project.teamName, team?.teamName, projectCategory(project), ...technologyList(project)].join(' ').toLocaleLowerCase('pt-BR');
      return (!query || text.includes(query.toLocaleLowerCase('pt-BR')))
        && (!categoryFilter || projectCategory(project) === categoryFilter)
        && (!yearFilter || String(project.year ?? '') === yearFilter)
        && (!visibilityFilter || visibilityOf(project) === visibilityFilter);
    });

    root.innerHTML = `<section class="page-heading"><div><p class="eyebrow">INOVAÇÃO · MEMÓRIA</p><h1>Biblioteca de projetos</h1><p>Conheça as equipes, seus protótipos e o que aprenderam pelo caminho.</p></div><span class="page-heading-icon">⌘</span></section>
      <div class="project-toolbar"><div class="project-tabs" role="tablist"><button class="project-tab ${tab === 'library' ? 'is-active' : ''}" data-tab="library">Projetos <span>${allProjects.length}</span></button><button class="project-tab ${tab === 'history' ? 'is-active' : ''}" data-tab="history">Histórico <span>${endedCompetitions().length}</span></button></div>${tab === 'library' && canCreate(user) ? '<button class="button button--primary project-create" data-action="create">+ Novo projeto</button>' : ''}</div>
      ${tab === 'library' ? `<section class="project-filters"><label class="project-search">Buscar<input type="search" data-filter="query" placeholder="Título, equipe, tecnologia..." value="${safe(query)}"></label><label>Categoria<select data-filter="category"><option value="">Todas as categorias</option>${categories.map((item) => `<option ${item === categoryFilter ? 'selected' : ''}>${safe(item)}</option>`).join('')}</select></label><label>Ano<select data-filter="year"><option value="">Todos os anos</option>${years.map((item) => `<option ${item === yearFilter ? 'selected' : ''}>${safe(item)}</option>`).join('')}</select></label><label>Visibilidade<select data-filter="visibility"><option value="">Todas</option><option value="public" ${visibilityFilter === 'public' ? 'selected' : ''}>Públicos</option><option value="private" ${visibilityFilter === 'private' ? 'selected' : ''}>Privados</option></select></label></section>
        ${filtered.length ? `<div class="project-grid">${filtered.map((project) => projectCard(project, user)).join('')}</div>` : emptyProjects(allProjects.length === 0)}
      ` : renderHistory(user)}
      <div class="project-modal-host"></div>`;

    root.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { tab = button.dataset.tab; draw(); }));
    root.querySelector('[data-action="create"]')?.addEventListener('click', () => openProjectForm(root, null, user, draw));
    root.querySelectorAll('[data-action="edit"]').forEach((button) => button.addEventListener('click', () => openProjectForm(root, button.dataset.id, user, draw)));
    root.querySelectorAll('[data-filter]').forEach((field) => field.addEventListener(field.tagName === 'INPUT' ? 'input' : 'change', () => {
      query = root.querySelector('[data-filter="query"]')?.value ?? '';
      categoryFilter = root.querySelector('[data-filter="category"]')?.value ?? '';
      yearFilter = root.querySelector('[data-filter="year"]')?.value ?? '';
      visibilityFilter = root.querySelector('[data-filter="visibility"]')?.value ?? '';
      draw();
      const input = root.querySelector('[data-filter="query"]');
      if (input && field.type === 'search') { input.focus(); input.setSelectionRange(query.length, query.length); }
    }));
    root.querySelectorAll('.project-comment-form').forEach((form) => form.addEventListener('submit', (event) => submitComment(event, form, user, draw)));
  };
  draw();
}

function canCreate(user) { return user.role === ROLES.ADMIN || user.role === ROLES.TEACHER; }
function visibilityOf(project) { return project.visibility === 'private' || project.isPublic === false ? 'private' : 'public'; }
function schoolIdsFor(user) {
  return new Set([...(user.schoolIds ?? []), ...(user.schoolId ? [user.schoolId] : [])]);
}
function canEdit(project, user) {
  if (user.role === ROLES.ADMIN) return true;
  const linkedSchool = project.schoolId && schools.findById(project.schoolId);
  const assignedToSchool = linkedSchool && (linkedSchool.teacherIds?.includes(user.id) || linkedSchool.teacherId === user.id || linkedSchool.professorId === user.id);
  return user.role === ROLES.TEACHER && (project.createdBy === user.id || schoolIdsFor(user).has(project.schoolId) || assignedToSchool);
}
function canView(project, user) { return visibilityOf(project) === 'public' || canEdit(project, user); }

function teamFor(project) {
  return registrations.findById(project.registrationId ?? project.teamId);
}
function categoryName(categoryId) { return categories.findById(categoryId)?.name ?? categoryId ?? ''; }
function projectCategory(project) { return project.category || categoryName(project.categoryId); }

function projectCard(project, user) {
  const team = teamFor(project);
  const title = project.title ?? project.name ?? 'Projeto sem título';
  const teamName = project.teamName ?? team?.teamName ?? project.members?.map((member) => member.name).filter(Boolean).join(', ') ?? 'Equipe não informada';
  const schoolName = project.schoolName ?? team?.schoolName ?? 'Escola não informada';
  const comments = commentsFor(project);
  const image = safeImage(project.imageData ?? project.imageUrl);
  return `<article class="project-card">
    ${image ? `<img class="project-image" src="${image}" alt="Imagem do projeto ${safe(title)}" loading="lazy">` : ''}
    <div class="project-card-body"><div class="project-card-top"><div><p class="eyebrow">${safe(project.category || categoryName(project.categoryId) || 'Robótica escolar')} · ${safe(project.year || 'Ano não informado')}</p><h2>${safe(title)}</h2></div><span class="project-visibility ${visibilityOf(project)}">${visibilityOf(project) === 'public' ? 'Público' : 'Privado'}</span></div>
      <p class="project-summary">${safe(project.summary || 'Resumo não informado.')}</p>
      <div class="project-meta"><span><b>Equipe</b>${safe(teamName)}</span><span><b>Escola</b>${safe(schoolName)}</span></div>
      <details class="project-details"><summary>Descrição técnica e aprendizados</summary><div class="project-detail-content">
        ${detailBlock('Descrição técnica', project.technicalDescription ?? project.description)}
        ${detailBlock('Objetivos', project.objectives)}${detailBlock('Tecnologias', technologyList(project).join(', ') || project.technologiesText)}
        ${detailBlock('Desenvolvimento', project.development)}${detailBlock('Dificuldades e soluções', combineChallenges(project))}${detailBlock('Lições aprendidas', project.lessonsLearned)}
      </div></details>
      ${comments.length ? `<section class="project-comments"><h3>Comentários de jurados</h3>${comments.map((comment) => `<blockquote><p>${safe(comment.comments ?? comment.comment)}</p><footer>${safe(comment.judgeName ?? comment.authorName ?? 'Jurado')} · ${safe(formatDate(comment.createdAt))}</footer></blockquote>`).join('')}</section>` : ''}
      ${user.role === ROLES.JUDGE && visibilityOf(project) === 'public' ? `<form class="project-comment-form" data-project="${safe(project.id)}"><label>Deixe um comentário<input name="comment" maxlength="1200" required placeholder="Comentário do jurado"></label><button class="button button--subtle" type="submit">Comentar</button></form>` : ''}
      <div class="project-card-actions">${canEdit(project, user) ? `<button class="button button--subtle" data-action="edit" data-id="${safe(project.id)}">Editar projeto</button>` : ''}<small>Atualizado ${safe(formatDate(project.updatedAt ?? project.createdAt))}</small></div>
    </div></article>`;
}

function detailBlock(title, content) { return content ? `<div><strong>${title}</strong><p>${safe(content)}</p></div>` : ''; }
function technologyList(project) { return Array.isArray(project.technologies) ? project.technologies : typeof project.technologies === 'string' ? project.technologies.split(',').map((item) => item.trim()).filter(Boolean) : []; }
function combineChallenges(project) {
  const parts = [project.challenges, project.solutions].filter(Boolean);
  return parts.length ? parts.map((part, index) => `${index === 0 ? 'Dificuldades' : 'Soluções'}: ${part}`).join('\n\n') : '';
}
function safeImage(value) {
  if (typeof value !== 'string') return '';
  if (/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) && value.length <= imageLimit * 1.4) return value;
  if (/^https?:\/\//i.test(value)) return safe(value);
  return '';
}
function commentsFor(project) {
  const stored = Array.isArray(project.juryComments) ? project.juryComments : [];
  return [...stored, ...evaluations.list().filter((item) => item.projectId === project.id && (item.comments || item.comment))];
}

function openProjectForm(root, projectId, user, draw) {
  const project = projects.findById(projectId) ?? {};
  if (projectId && !canEdit(project, user)) return showToast('Você não pode editar este projeto.', 'error');
  const teamOptions = registrations.list().map((team) => `<option value="${safe(team.id)}" ${(project.registrationId ?? project.teamId) === team.id ? 'selected' : ''}>${safe(team.teamName)} · ${safe(team.schoolName)}</option>`).join('');
  const host = root.querySelector('.project-modal-host');
  host.innerHTML = `<div class="project-backdrop"><section class="project-dialog" role="dialog" aria-modal="true" aria-labelledby="project-form-title"><div class="dialog-heading"><div><p class="eyebrow">BIBLIOTECA ESCOLAR</p><h2 id="project-form-title">${projectId ? 'Editar projeto' : 'Novo projeto'}</h2></div><button class="dialog-close" type="button" aria-label="Fechar">×</button></div>
    <form class="project-form" data-id="${safe(project.id)}">
      <div class="form-row"><label>Título<input name="title" required maxlength="120" value="${safe(project.title ?? project.name)}"></label><label>Ano<input name="year" type="number" min="2000" max="2100" required value="${safe(project.year ?? new Date().getFullYear())}"></label></div>
      <label>Resumo<textarea name="summary" rows="2" maxlength="500" required>${safe(project.summary)}</textarea></label><label>Descrição técnica<textarea name="technicalDescription" rows="4" maxlength="5000" placeholder="Como o projeto funciona?">${safe(project.technicalDescription ?? project.description)}</textarea></label>
      <label>Equipe inscrita<select name="registrationId"><option value="">Vincular a uma inscrição (opcional)</option>${teamOptions}</select></label>
      <div class="form-row"><label>Nome da equipe<input name="teamName" maxlength="120" value="${safe(project.teamName ?? teamFor(project)?.teamName ?? project.members?.map((member) => member.name).filter(Boolean).join(', '))}"></label><label>Escola<input name="schoolName" maxlength="160" value="${safe(project.schoolName ?? teamFor(project)?.schoolName)}"></label></div>
      <label>Categoria<input name="category" maxlength="100" value="${safe(project.category ?? categoryName(project.categoryId ?? teamFor(project)?.categoryId))}"></label>
      <label>Objetivos<textarea name="objectives" rows="3" maxlength="3000">${safe(project.objectives)}</textarea></label><label>Tecnologias (separe por vírgulas)<input name="technologies" maxlength="500" value="${safe(technologyList(project).join(', ') || project.technologiesText)}" placeholder="Arduino, impressão 3D, Python"></label>
      <label>Desenvolvimento<textarea name="development" rows="4" maxlength="5000">${safe(project.development)}</textarea></label>
      <div class="form-row"><label>Dificuldades<textarea name="challenges" rows="3" maxlength="2500">${safe(project.challenges)}</textarea></label><label>Soluções encontradas<textarea name="solutions" rows="3" maxlength="2500">${safe(project.solutions)}</textarea></label></div>
      <label>Lições aprendidas<textarea name="lessonsLearned" rows="3" maxlength="3000">${safe(project.lessonsLearned)}</textarea></label>
      <div class="form-row"><label>Imagem pequena (PNG, JPEG ou WebP, até 200 KB)<input name="image" type="file" accept="image/png,image/jpeg,image/webp"><input name="imageUrl" type="url" maxlength="500" value="${safe(project.imageUrl)}" placeholder="ou cole um link de imagem"></label><label>Visibilidade<select name="visibility"><option value="public" ${visibilityOf(project) === 'public' ? 'selected' : ''}>Público</option><option value="private" ${visibilityOf(project) === 'private' ? 'selected' : ''}>Privado</option></select></label></div>
      <p class="form-hint">Comentários de jurados ficam associados às avaliações existentes do projeto.</p><div class="dialog-actions"><button type="button" class="button button--subtle dialog-cancel">Cancelar</button><button class="button button--primary" type="submit">Salvar projeto</button></div>
    </form></section></div>`;
  const close = () => { host.innerHTML = ''; };
  host.querySelector('.dialog-close').addEventListener('click', close);
  host.querySelector('.dialog-cancel').addEventListener('click', close);
  host.querySelector('.project-backdrop').addEventListener('click', (event) => { if (event.target === event.currentTarget) close(); });
  const teamSelect = host.querySelector('[name="registrationId"]');
  teamSelect.addEventListener('change', () => {
    const team = registrations.findById(teamSelect.value);
    if (!team) return;
    host.querySelector('[name="teamName"]').value = team.teamName ?? '';
    host.querySelector('[name="schoolName"]').value = team.schoolName ?? '';
    host.querySelector('[name="category"]').value = categoryName(team.categoryId);
  });
  host.querySelector('.project-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const linkedTeam = registrations.findById(values.get('registrationId'));
    let imageData = project.imageData ?? '';
    const imageFile = values.get('image');
    if (imageFile?.size) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(imageFile.type) || imageFile.size > imageLimit) return showToast('A imagem deve ser PNG, JPEG ou WebP e ter no máximo 200 KB.', 'error');
      try { imageData = await readImage(imageFile); }
      catch (error) { return showToast(error.message || 'Não foi possível ler a imagem.', 'error'); }
    }
    const imageUrl = values.get('imageUrl')?.trim() || '';
    const now = new Date().toISOString();
    const record = {
      ...project,
      id: project.id ?? id(),
      title: values.get('title').trim(), name: values.get('title').trim(),
      summary: values.get('summary').trim(), technicalDescription: values.get('technicalDescription').trim(),
      description: values.get('technicalDescription').trim(),
      registrationId: linkedTeam?.id ?? null, teamId: linkedTeam?.id ?? null,
      teamName: values.get('teamName').trim(), schoolName: values.get('schoolName').trim(), schoolId: linkedTeam?.schoolId ?? null,
      category: values.get('category').trim(), categoryId: linkedTeam?.categoryId ?? null,
      competitionId: linkedTeam?.competitionId ?? null,
      year: Number(values.get('year')), objectives: values.get('objectives').trim(),
      technologies: values.get('technologies').split(',').map((item) => item.trim()).filter(Boolean),
      development: values.get('development').trim(), challenges: values.get('challenges').trim(), solutions: values.get('solutions').trim(),
      lessonsLearned: values.get('lessonsLearned').trim(), visibility: values.get('visibility'), imageData, imageUrl,
      createdBy: project.createdBy ?? user.id, createdAt: project.createdAt ?? now, updatedAt: now,
    };
    try {
      if (project.id) projects.update(project.id, record); else projects.create(record);
      close(); draw(); showToast('Projeto salvo na biblioteca.');
    } catch (error) { showToast(error.message || 'Não foi possível salvar o projeto.', 'error'); }
  });
}

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

function submitComment(event, form, user, draw) {
  event.preventDefault();
  const project = projects.findById(form.dataset.project);
  if (!project || user.role !== ROLES.JUDGE || visibilityOf(project) !== 'public') return showToast('Você não pode comentar neste projeto.', 'error');
  const comment = new FormData(form).get('comment')?.trim();
  if (!comment) return;
  try {
    evaluations.create({ id: `eval-${id()}`, projectId: project.id, judgeId: user.id, judgeName: user.name, comments: comment, scores: {}, status: 'concluida', createdAt: new Date().toISOString() });
    draw(); showToast('Comentário registrado.');
  } catch (error) { showToast(error.message || 'Não foi possível registrar o comentário.', 'error'); }
}

function endedCompetitions() {
  const today = new Date().toISOString().slice(0, 10);
  return competitions.list().filter((item) => ['encerrada', 'finalizada', 'concluida', 'closed', 'completed'].includes(String(item.status ?? '').toLocaleLowerCase('pt-BR')) || (item.endDate && item.endDate < today));
}

function renderHistory(user) {
  const events = endedCompetitions();
  if (!events.length) return '<article class="panel project-empty"><span class="placeholder-icon">◷</span><h2>Nenhuma competição encerrada</h2><p>O histórico aparecerá aqui quando houver eventos concluídos.</p></article>';
  const entries = events.map((event) => {
    const teams = registrations.list().filter((team) => team.competitionId === event.id);
    const results = evaluations.list();
    return `<article class="history-card"><div class="history-heading"><div><p class="eyebrow">${safe(event.year ?? (event.endDate ?? event.startDate ?? '').slice(0, 4))} · ${safe(event.location ?? 'Local não informado')}</p><h2>${safe(event.name)}</h2></div><span class="history-status">Encerrada</span></div><p class="history-dates">${safe(formatDate(event.startDate))}${event.endDate ? ` — ${safe(formatDate(event.endDate))}` : ''}</p>
      ${teams.length ? `<div class="history-teams">${teams.map((team) => {
        const foundProject = projects.list().find((item) => (item.registrationId ?? item.teamId) === team.id);
        const project = foundProject && canView(foundProject, user) ? foundProject : null;
        const evaluation = project ? results.find((item) => item.projectId === project.id) : null;
        const result = team.result ?? team.placement ?? project?.result ?? project?.placement ?? evaluation?.result ?? evaluation?.placement;
        const hasResult = result !== undefined && result !== null && result !== '';
        return `<div class="history-team"><div><strong>${safe(team.teamName ?? project?.teamName ?? 'Equipe')}</strong><span>${safe(team.schoolName ?? project?.schoolName ?? '')}${team.categoryId ? ` · ${safe(team.categoryId)}` : ''}</span></div><div class="history-result">${hasResult ? safe(result) : evaluation?.scores && Object.keys(evaluation.scores).length ? `Pontuação: ${safe(Object.values(evaluation.scores).reduce((sum, value) => sum + Number(value || 0), 0))}` : `<span>${safe(team.status ?? 'Participou')}</span>`}<small>${safe(project?.title ?? '')}</small></div></div>`;
      }).join('')}</div>` : '<p class="muted-copy">Nenhuma equipe vinculada a esta competição.</p>'}</article>`;
  }).join('');
  return `<section class="history-list">${entries}</section>`;
}

function emptyProjects(isEmpty) {
  return `<article class="panel project-empty"><span class="placeholder-icon">⌘</span><h2>${isEmpty ? 'A biblioteca está vazia' : 'Nenhum projeto encontrado'}</h2><p>${isEmpty ? 'Cadastre um projeto para guardar a trajetória das equipes.' : 'Tente alterar os filtros ou a busca.'}</p></article>`;
}

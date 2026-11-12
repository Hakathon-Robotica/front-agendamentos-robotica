import { EntityService } from '../services/entity-service.js';
import { StorageService } from '../services/storage-service.js';
import { escapeHTML, showToast } from '../utils/dom.js';
import { DEFAULT_CATEGORIES } from '../data/default-categories.js';

const competitions = new EntityService('competitions');
const read = (key) => StorageService.get(key, []);
const write = (key, value) => StorageService.set(key, value);
const id = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const date = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const safe = escapeHTML;

export function renderCompetitions(root) {
  ensureDefaultCategories();
  if (!document.querySelector('#competitions-styles')) {
    const stylesheet = document.createElement('link'); stylesheet.id = 'competitions-styles'; stylesheet.rel = 'stylesheet'; stylesheet.href = './src/styles/competitions.css'; document.head.append(stylesheet);
  }
  let tab = 'competitions';
  const draw = () => {
    const items = competitions.list();
    const notices = read('notices');
    const categories = read('categories');
    root.innerHTML = `<section class="page-heading"><div><p class="eyebrow">EVENTOS</p><h1>Competições</h1><p>Organize eventos, editais e categorias em um só lugar.</p></div><span class="page-heading-icon">◇</span></section>
      <div class="competition-toolbar"><div class="competition-tabs" role="tablist"><button class="competition-tab ${tab === 'competitions' ? 'is-active' : ''}" data-tab="competitions">Competições <span>${items.length}</span></button><button class="competition-tab ${tab === 'notices' ? 'is-active' : ''}" data-tab="notices">Editais <span>${notices.length}</span></button><button class="competition-tab ${tab === 'categories' ? 'is-active' : ''}" data-tab="categories">Categorias <span>${categories.length}</span></button></div><button class="button button--primary competition-add" data-action="add">+ ${tab === 'competitions' ? 'Nova competição' : tab === 'notices' ? 'Novo edital' : 'Nova categoria'}</button></div>
      <section class="competition-list">${tab === 'competitions' ? competitionList(items, notices) : tab === 'notices' ? noticeList(notices, items) : categoryList(categories)}</section>
      <div class="competition-modal-host"></div>`;
    root.querySelectorAll('[data-tab]').forEach((button) => button.addEventListener('click', () => { tab = button.dataset.tab; draw(); }));
    root.querySelector('[data-action="add"]').addEventListener('click', () => openForm(root, tab, null, draw));
    root.querySelectorAll('[data-action="edit"]').forEach((button) => button.addEventListener('click', () => openForm(root, tab, button.dataset.id, draw)));
    root.querySelectorAll('[data-action="delete"]').forEach((button) => button.addEventListener('click', () => removeItem(tab, button.dataset.id, draw)));
    root.querySelectorAll('[data-action="publish"]').forEach((button) => button.addEventListener('click', () => publish(button.dataset.id, draw)));
    root.querySelectorAll('[data-action="registrations"]').forEach((button) => button.addEventListener('click', () => toggleRegistrations(button.dataset.id, draw)));
  };
  draw();
}

function competitionList(items, notices) {
  if (!items.length) return empty('Nenhuma competição cadastrada', 'Crie uma competição para começar a organizar seu evento.');
  return items.map((item) => {
    const notice = notices.find((entry) => entry.competitionId === item.id && entry.published);
    const ready = Boolean(notice);
    return `<article class="competition-card"><div class="competition-card-top"><div><p class="eyebrow">${safe(item.format || 'POINTS')} · ${safe(item.location || 'Local a definir')}</p><h2>${safe(item.name)}</h2></div><span class="competition-status ${item.registrationsOpen ? 'is-open' : ready ? 'is-ready' : 'is-locked'}">${item.registrationsOpen ? 'Inscrições abertas' : ready ? 'Edital publicado' : 'Edital pendente'}</span></div><p class="competition-description">${safe(item.description || 'Sem descrição.')}</p><div class="competition-meta"><span>◷ Evento: ${date(item.startDate)}${item.endDate ? ` – ${date(item.endDate)}` : ''}</span><span>⌖ ${safe(item.location || 'Local a definir')}</span><span>◎ Limite: ${safe(item.registrationLimit || 'Sem limite')}</span><span>Inscrições: ${item.registrationStart ? date(item.registrationStart) : 'A definir'}${item.registrationEnd ? ` – ${date(item.registrationEnd)}` : ''}</span></div><div class="competition-card-bottom"><span class="competition-gate">${ready ? '✓ Pronta para abrir inscrições' : '▣ Publique o edital para liberar inscrições'}</span><div class="competition-actions"><button class="button button--subtle" data-action="edit" data-id="${safe(item.id)}">Editar</button><button class="button ${item.registrationsOpen ? 'button--subtle' : 'button--primary'}" data-action="registrations" data-id="${safe(item.id)}" ${!ready ? 'disabled title="Publique o edital antes de abrir inscrições"' : ''}>${item.registrationsOpen ? 'Encerrar inscrições' : 'Abrir inscrições'}</button><button class="icon-danger" aria-label="Excluir competição" data-action="delete" data-id="${safe(item.id)}">Excluir</button></div></div></article>`;
  }).join('');
}
function noticeList(items, events) {
  if (!items.length) return empty('Nenhum edital cadastrado', 'Cadastre o edital e publique-o para liberar as inscrições da competição.');
  return items.map((item) => `<article class="competition-card"><div class="competition-card-top"><div><p class="eyebrow">EDITAL · ${item.published ? 'PUBLICADO' : 'RASCUNHO'}</p><h2>${safe(item.title)}</h2></div><span class="competition-status ${item.published ? 'is-ready' : 'is-locked'}">${item.published ? 'Publicado' : 'Rascunho'}</span></div><p class="competition-description">${safe(events.find((event) => event.id === item.competitionId)?.name || 'Competição removida')} · ${safe(item.summary || 'Sem resumo.')}</p><div class="competition-meta"><span>Atualizado em ${date(item.updatedAt)}</span></div><div class="competition-card-bottom"><span class="competition-gate">${item.published ? '✓ Este edital libera as inscrições' : 'Edite o conteúdo antes de publicar'}</span><div class="competition-actions">${!item.published ? `<button class="button button--primary" data-action="publish" data-id="${safe(item.id)}">Publicar edital</button>` : ''}<button class="button button--subtle" data-action="edit" data-id="${safe(item.id)}">Editar</button><button class="icon-danger" aria-label="Excluir edital" data-action="delete" data-id="${safe(item.id)}">Excluir</button></div></div></article>`).join('');
}
function categoryList(items) {
  if (!items.length) return empty('Nenhuma categoria cadastrada', 'Defina critérios de idade e escolaridade para os participantes.');
  return items.map((item) => `<article class="competition-card category-card"><div class="competition-card-top"><div><p class="eyebrow">CATEGORIA DE COMPETIÇÃO</p><h2>${safe(item.name)}</h2></div><span class="competition-status ${item.active ? 'is-ready' : 'is-locked'}">${item.active ? 'Ativa' : 'Inativa'}</span></div><p class="competition-description">${safe(item.description || 'Descrição ainda não informada.')}</p><div class="competition-meta"><span>Idade: ${item.minAge !== '' && item.minAge != null ? safe(item.minAge) : 'Sem mínimo'}–${item.maxAge !== '' && item.maxAge != null ? safe(item.maxAge) : 'Sem máximo'}</span><span>Integrantes: ${item.minMembers !== '' && item.minMembers != null ? safe(item.minMembers) : 'Sem mínimo'}–${item.maxMembers !== '' && item.maxMembers != null ? safe(item.maxMembers) : 'Sem máximo'}</span><span>Escolaridade: ${safe(item.schoolingMin || 'Sem mínimo')} – ${safe(item.schoolingMax || 'Sem máximo')}</span></div><details class="category-rules"><summary>Descrição completa e regras de participação</summary><p>${safe(item.description || 'Descrição ainda não informada.')}</p><p><strong>Regras:</strong> ${safe(item.participationRules || 'Regras ainda não informadas.')}</p></details><div class="competition-card-bottom"><span class="competition-gate">${item.key ? 'Categoria pré-cadastrada · critérios editáveis' : 'Categoria personalizada'}</span><div class="competition-actions"><button class="button button--subtle" data-action="edit" data-id="${safe(item.id)}">Editar categoria</button><button class="icon-danger" aria-label="Excluir categoria" data-action="delete" data-id="${safe(item.id)}">Excluir</button></div></div></article>`).join('');
}
function empty(title, copy) { return `<div class="panel competition-empty"><span class="placeholder-icon">◇</span><h2>${title}</h2><p>${copy}</p></div>`; }

function openForm(root, tab, itemId, draw) {
  const collection = tab === 'competitions' ? null : tab === 'notices' ? 'notices' : 'categories';
  const data = tab === 'competitions' ? competitions.list() : read(collection);
  const item = data.find((entry) => entry.id === itemId) ?? {};
  const host = root.querySelector('.competition-modal-host');
  const title = tab === 'competitions' ? (itemId ? 'Editar competição' : 'Nova competição') : tab === 'notices' ? (itemId ? 'Editar edital' : 'Novo edital') : (itemId ? 'Editar categoria' : 'Nova categoria');
  const events = competitions.list();
  const eventSelect = `<label>Competição<select name="competitionId" required>${events.map((event) => `<option value="${safe(event.id)}" ${event.id === item.competitionId ? 'selected' : ''}>${safe(event.name)}</option>`).join('')}</select></label>`;
  let fields = '';
  if (tab === 'competitions') fields = `<label>Nome da competição<input name="name" required maxlength="100" value="${safe(item.name || '')}"></label><label>Descrição<textarea name="description" rows="3">${safe(item.description || '')}</textarea></label><div class="form-row"><label>Data de início<input type="date" name="startDate" required value="${safe(item.startDate || '')}"></label><label>Data de encerramento<input type="date" name="endDate" value="${safe(item.endDate || '')}"></label></div><div class="form-row"><label>Início das inscrições<input type="date" name="registrationStart" value="${safe(item.registrationStart || '')}"></label><label>Fim das inscrições<input type="date" name="registrationEnd" value="${safe(item.registrationEnd || '')}"></label></div><label>Local<input name="location" required value="${safe(item.location || '')}"></label><div class="form-row"><label>Limite de inscrições<input type="number" name="registrationLimit" min="1" placeholder="Sem limite" value="${safe(item.registrationLimit || '')}"></label><label>Formato<select name="format"><option ${item.format === 'POINTS' ? 'selected' : ''}>POINTS</option><option ${item.format === 'KNOCKOUT' ? 'selected' : ''}>KNOCKOUT</option></select></label></div><fieldset class="category-picker"><legend>Categorias desta competição</legend>${read('categories').filter((category) => category.active !== false).map((category) => `<label class="category-picker-option"><input type="checkbox" name="categoryIds" value="${safe(category.id)}" ${(item.categoryIds || []).includes(category.id) ? 'checked' : ''}>${safe(category.name)}</label>`).join('')}</fieldset>`;
  else if (tab === 'notices') fields = `${events.length ? eventSelect : '<p class="form-hint">Cadastre uma competição antes de criar um edital.</p>'}<label>Título do edital<input name="title" required maxlength="120" value="${safe(item.title || '')}"></label><label>Resumo / conteúdo<textarea name="summary" rows="6" required>${safe(item.summary || '')}</textarea></label>`;
  else fields = `<label>Nome da categoria<input name="name" required maxlength="80" value="${safe(item.name || '')}"></label><label>Descrição completa<textarea name="description" rows="4">${safe(item.description || '')}</textarea></label><label>Regras de participação<textarea name="participationRules" rows="4">${safe(item.participationRules || '')}</textarea></label><div class="form-row"><label>Idade mínima<input type="number" name="minAge" min="0" max="99" placeholder="Sem mínimo" value="${safe(item.minAge ?? '')}"></label><label>Idade máxima<input type="number" name="maxAge" min="0" max="99" placeholder="Sem máximo" value="${safe(item.maxAge ?? '')}"></label></div><div class="form-row"><label>Integrantes mínimos<input type="number" name="minMembers" min="1" placeholder="Sem mínimo" value="${safe(item.minMembers ?? '')}"></label><label>Integrantes máximos<input type="number" name="maxMembers" min="1" placeholder="Sem máximo" value="${safe(item.maxMembers ?? '')}"></label></div><div class="form-row"><label>Escolaridade mínima<input name="schoolingMin" placeholder="Sem mínimo" value="${safe(item.schoolingMin || '')}"></label><label>Escolaridade máxima<input name="schoolingMax" placeholder="Sem máximo" value="${safe(item.schoolingMax || '')}"></label></div><label>Outros critérios<input name="schooling" placeholder="Ex.: série, modalidade ou observações" value="${safe(item.schooling || '')}"></label><div class="form-row"><label>Formato<select name="format"><option ${item.format === 'POINTS' ? 'selected' : ''}>POINTS</option><option ${item.format === 'KNOCKOUT' ? 'selected' : ''}>KNOCKOUT</option></select></label><label class="checkbox-field"><input type="checkbox" name="active" ${item.active !== false ? 'checked' : ''}> Categoria ativa</label></div>`;
  host.innerHTML = `<div class="competition-backdrop"><section class="competition-dialog" role="dialog" aria-modal="true" aria-labelledby="competition-dialog-title"><div class="dialog-heading"><div><p class="eyebrow">${tab === 'competitions' ? 'EVENTOS' : tab === 'notices' ? 'DOCUMENTAÇÃO' : 'REGRAS'}</p><h2 id="competition-dialog-title">${title}</h2></div><button type="button" class="dialog-close" aria-label="Fechar">×</button></div><form class="competition-form">${fields}<div class="dialog-actions"><button type="button" class="button button--subtle dialog-cancel">Cancelar</button><button class="button button--primary" type="submit">Salvar</button></div></form></section></div>`;
  const close = () => { host.innerHTML = ''; };
  host.querySelector('.dialog-close').addEventListener('click', close);
  host.querySelector('.dialog-cancel').addEventListener('click', close);
  host.querySelector('.competition-backdrop').addEventListener('click', (event) => { if (event.target === event.currentTarget) close(); });
  host.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = Object.fromEntries(formData.entries());
    if (tab === 'competitions') {
      if (value.endDate && value.endDate < value.startDate) return showToast('A data de encerramento deve ser posterior ao início.', 'error');
      if (value.registrationStart && value.registrationEnd && value.registrationEnd < value.registrationStart) return showToast('O fim das inscrições deve ser posterior ao início.', 'error');
      value.registrationLimit = value.registrationLimit ? Number(value.registrationLimit) : null;
      value.categoryIds = formData.getAll('categoryIds');
      value.registrationsOpen = item.registrationsOpen ?? false;
      value.status = item.status || 'planejada';
      value.createdAt = item.createdAt || new Date().toISOString(); value.updatedAt = new Date().toISOString();
      if (itemId) competitions.update(itemId, value); else competitions.create({ id: id(), ...value });
    } else {
      if (tab === 'categories') {
        for (const field of ['minAge', 'maxAge', 'minMembers', 'maxMembers']) value[field] = value[field] === '' ? null : Number(value[field]);
        if (value.minAge != null && value.maxAge != null && value.minAge > value.maxAge) return showToast('A idade mínima não pode superar a máxima.', 'error');
        if (value.minMembers != null && value.maxMembers != null && value.minMembers > value.maxMembers) return showToast('O mínimo de integrantes não pode superar o máximo.', 'error');
        value.active = formData.has('active');
      }
      if (tab === 'notices') {
        value.published = false;
        if (item.published) {
          const eventRecord = competitions.findById(item.competitionId);
          if (eventRecord?.registrationsOpen) competitions.update(eventRecord.id, { registrationsOpen: false, updatedAt: new Date().toISOString() });
        }
      }
      value.updatedAt = new Date().toISOString(); value.createdAt = item.createdAt || value.updatedAt;
      if (itemId) write(collection, data.map((entry) => entry.id === itemId ? { ...entry, ...value } : entry));
      else write(collection, [...data, { id: id(), ...value }]);
    }
    close(); draw(); showToast('Registro salvo com sucesso.');
  });
}

function publish(noticeId, draw) {
  const items = read('notices');
  const notice = items.find((item) => item.id === noticeId);
  if (!notice?.summary?.trim()) return showToast('Adicione o conteúdo do edital antes de publicar.', 'error');
  write('notices', items.map((item) => item.id === noticeId ? { ...item, published: true, publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : item));
  draw(); showToast('Edital publicado. As inscrições podem ser abertas.');
}
function toggleRegistrations(eventId, draw) {
  const event = competitions.findById(eventId);
  if (!event) return;
  const hasPublishedNotice = read('notices').some((notice) => notice.competitionId === eventId && notice.published);
  if (!event.registrationsOpen && !hasPublishedNotice) return showToast('Publique o edital antes de abrir inscrições.', 'error');
  competitions.update(eventId, { registrationsOpen: !event.registrationsOpen, updatedAt: new Date().toISOString() });
  draw(); showToast(event.registrationsOpen ? 'Inscrições encerradas.' : 'Inscrições abertas.');
}
function removeItem(tab, itemId, draw) {
  if (tab === 'competitions') {
    competitions.remove(itemId);
    write('notices', read('notices').filter((item) => item.competitionId !== itemId));
  }
  else if (tab === 'notices') {
    const notice = read('notices').find((item) => item.id === itemId);
    write('notices', read('notices').filter((item) => item.id !== itemId));
    if (notice?.published) {
      const event = competitions.findById(notice.competitionId);
      if (event?.registrationsOpen) competitions.update(event.id, { registrationsOpen: false, updatedAt: new Date().toISOString() });
    }
  } else {
    const category = read('categories').find((item) => item.id === itemId);
    write('categories', read('categories').filter((item) => item.id !== itemId));
    if (category?.key) write('deletedCategoryKeys', [...new Set([...read('deletedCategoryKeys'), category.key])]);
    for (const competition of competitions.list()) {
      if (competition.categoryIds?.includes(itemId)) competitions.update(competition.id, { categoryIds: competition.categoryIds.filter((categoryId) => categoryId !== itemId), updatedAt: new Date().toISOString() });
    }
  }
  draw(); showToast('Registro excluído.');
}

function ensureDefaultCategories() {
  let current = read('categories');
  const keys = new Set(current.map((category) => category.key).filter(Boolean));
  const deleted = new Set(read('deletedCategoryKeys'));
  const now = new Date().toISOString();
  let changed = false;
  for (const preset of DEFAULT_CATEGORIES) {
    if (keys.has(preset.key) || deleted.has(preset.key)) continue;
    const existing = current.find((category) => category.name?.trim().toLocaleLowerCase('pt-BR') === preset.name.toLocaleLowerCase('pt-BR'));
    if (!existing) continue;
    Object.assign(existing, { key: preset.key, participationRules: existing.participationRules || preset.participationRules, minMembers: existing.minMembers ?? null, maxMembers: existing.maxMembers ?? null, schoolingMin: existing.schoolingMin || '', schoolingMax: existing.schoolingMax || '' });
    keys.add(preset.key); changed = true;
  }
  const missing = DEFAULT_CATEGORIES.filter((category) => !keys.has(category.key) && !deleted.has(category.key)).map((category) => ({
    ...category,
    id: id(),
    minAge: null,
    maxAge: null,
    minMembers: null,
    maxMembers: null,
    schoolingMin: '',
    schoolingMax: '',
    schooling: '',
    active: true,
    createdAt: now,
    updatedAt: now,
  }));
  if (missing.length || changed) write('categories', [...current, ...missing]);
}

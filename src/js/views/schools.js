import { SchoolService } from '../services/school-service.js';
import { UserService } from '../services/user-service.js';
import { RegistrationService } from '../services/registration-service.js';
import { ROLES } from '../config.js';
import { escapeHTML, showToast } from '../utils/dom.js';

const safe = (value) => escapeHTML(value ?? '');

export function renderSchools(root) {
  const teachers = UserService.list().filter((user) => user.role === ROLES.TEACHER);
  const teams = RegistrationService.list();
  const items = SchoolService.list();
  const draw = () => renderSchools(root);
  root.innerHTML = `<section class="page-heading"><div><p class="eyebrow">ORGANIZAÇÃO</p><h1>Escolas</h1><p>Cadastre as escolas participantes e vincule os professores responsáveis pelas equipes.</p></div><span class="page-heading-icon">⌂</span></section>
    <div class="team-toolbar"><span>${items.length.toString().padStart(2, '0')} escola${items.length === 1 ? '' : 's'}</span><button class="button button--primary" type="button" data-action="new-school">+ Nova escola</button></div>
    ${items.length ? `<div class="approval-list">${items.map((school) => {
      const names = (school.teacherIds ?? []).map((id) => teachers.find((teacher) => teacher.id === id)?.name).filter(Boolean);
      const count = teams.filter((team) => team.schoolId === school.id).length;
      return `<article class="panel approval-card"><div class="approval-heading"><div><p class="eyebrow">${safe(school.city || 'Cidade não informada')}</p><h2>${safe(school.name)}</h2></div><span class="pending-tag status-aprovado">${count} EQUIPE${count === 1 ? '' : 'S'}</span></div><div class="approval-members"><strong>Professores responsáveis</strong><div>${names.length ? names.map((name) => `<span>${safe(name)}</span>`).join('') : '<span class="muted-copy">Nenhum professor vinculado</span>'}</div></div><div class="team-card-actions"><button class="button button--subtle" type="button" data-action="edit-school" data-id="${safe(school.id)}">Editar</button><button class="icon-danger" type="button" data-action="delete-school" data-id="${safe(school.id)}" aria-label="Excluir escola ${safe(school.name)}">Excluir</button></div></article>`;
    }).join('')}</div>` : `<article class="panel module-placeholder"><span class="placeholder-icon">⌂</span><p class="eyebrow">ESCOLAS</p><h2>Nenhuma escola cadastrada</h2><p>Cadastre uma escola para que suas equipes possam se inscrever nas competições.</p></article>`}
    <div class="team-modal-host"></div>`;
  root.querySelector('[data-action="new-school"]').addEventListener('click', () => openSchoolDialog(root, null, teachers, draw));
  root.querySelectorAll('[data-action="edit-school"]').forEach((button) => button.addEventListener('click', () => openSchoolDialog(root, button.dataset.id, teachers, draw)));
  root.querySelectorAll('[data-action="delete-school"]').forEach((button) => button.addEventListener('click', () => {
    const school = SchoolService.findById(button.dataset.id);
    if (!school || !window.confirm(`Excluir a escola "${school.name}"?`)) return;
    const result = SchoolService.remove(school.id);
    if (!result.ok) { showToast(result.errors[0], 'error'); return; }
    showToast('Escola excluída.');
    draw();
  }));
}

function openSchoolDialog(root, schoolId, teachers, onSaved) {
  const school = schoolId ? SchoolService.findById(schoolId) : {};
  const host = root.querySelector('.team-modal-host');
  host.innerHTML = `<div class="competition-backdrop"><section class="competition-dialog" role="dialog" aria-modal="true" aria-labelledby="school-dialog-title"><div class="dialog-heading"><div><p class="eyebrow">ORGANIZAÇÃO</p><h2 id="school-dialog-title">${schoolId ? 'Editar escola' : 'Nova escola'}</h2></div><button type="button" class="dialog-close" aria-label="Fechar">×</button></div>
    <form class="competition-form"><label>Nome da escola<input name="name" required maxlength="120" value="${safe(school.name)}"></label><label>Cidade<input name="city" maxlength="80" value="${safe(school.city)}"></label>
    <fieldset class="category-picker"><legend>Professores responsáveis</legend>${teachers.length ? teachers.map((teacher) => `<label class="category-picker-option"><input type="checkbox" name="teacherIds" value="${safe(teacher.id)}" ${(school.teacherIds ?? []).includes(teacher.id) ? 'checked' : ''}>${safe(teacher.name)}</label>`).join('') : '<p class="form-hint">Nenhum professor cadastrado.</p>'}</fieldset>
    <div class="form-errors" aria-live="polite"></div><div class="dialog-actions"><button type="button" class="button button--subtle dialog-cancel">Cancelar</button><button class="button button--primary" type="submit">Salvar</button></div></form></section></div>`;
  const close = () => { host.innerHTML = ''; };
  host.querySelector('.dialog-close').addEventListener('click', close);
  host.querySelector('.dialog-cancel').addEventListener('click', close);
  host.querySelector('.competition-backdrop').addEventListener('click', (event) => { if (event.target === event.currentTarget) close(); });
  host.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values = { name: data.get('name'), city: data.get('city'), teacherIds: data.getAll('teacherIds') };
    const result = schoolId ? SchoolService.update(schoolId, values) : SchoolService.create(values);
    if (!result.ok) { form.querySelector('.form-errors').innerHTML = `<ul>${result.errors.map((message) => `<li>${safe(message)}</li>`).join('')}</ul>`; return; }
    close();
    showToast('Escola salva com sucesso.');
    onSaved();
  });
}

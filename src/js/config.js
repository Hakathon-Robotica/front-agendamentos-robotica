export const APP_CONFIG = Object.freeze({
  name: 'Robótica Escolar',
  storagePrefix: 'robotica-escolar',
  storageVersion: 1,
});

export const ROLES = Object.freeze({ ADMIN: 'administrador', TEACHER: 'professor', JUDGE: 'jurado' });

export const ROLE_LABELS = Object.freeze({
  [ROLES.ADMIN]: 'Administrador',
  [ROLES.TEACHER]: 'Professor',
  [ROLES.JUDGE]: 'Jurado',
});

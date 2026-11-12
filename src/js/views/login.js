export function renderLogin(root, onLogin) {
  root.innerHTML = `
    <div class="login-card">
      <a class="brand brand--login" href="#inicio" aria-label="Robótica Escolar">
        <span class="brand-mark" aria-hidden="true">R<span>.</span></span>
        <span class="brand-copy"><strong>Robótica</strong><small>GESTÃO ESCOLAR</small></span>
      </a>
      <div class="login-heading"><p class="eyebrow">PORTAL DA ORGANIZAÇÃO</p><h1>Bem-vindo de volta</h1><p>Acesse seu espaço de trabalho.</p></div>
      <form id="login-form" class="login-form">
        <label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="username" placeholder="voce@escola.edu.br" required>
        <label for="password">Senha</label><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Sua senha" required>
        <button class="button button--primary button--wide" type="submit">Entrar no sistema <span aria-hidden="true">→</span></button>
      </form>
      <details class="demo-access"><summary>Acessos demonstrativos</summary>
        <div class="demo-list"><p><b>Administrador</b><span>admin@robotica.edu.br · admin123</span></p><p><b>Professor</b><span>professor@robotica.edu.br · prof123</span></p><p><b>Jurado</b><span>jurado@robotica.edu.br · jurado123</span></p></div>
      </details>
      <p class="login-footnote">Ambiente demonstrativo · dados armazenados neste navegador</p>
    </div>
    <div class="login-aside"><div class="aside-orbit orbit-one"></div><div class="aside-orbit orbit-two"></div><div class="aside-content"><span class="aside-kicker">IDEIAS QUE GANHAM MOVIMENTO</span><h2>O futuro começa<br>na sala de aula.</h2><p>Organize encontros, projetos e talentos que estão transformando o mundo.</p><div class="aside-stats"><div><strong>CRIAR</strong><span>com propósito</span></div><i></i><div><strong>INOVAR</strong><span>em equipe</span></div><i></i><div><strong>INSPIRAR</strong><span>o amanhã</span></div></div></div><span class="aside-footer">PLATAFORMA DE ROBÓTICA EDUCACIONAL</span></div>`;
  root.querySelector('#login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onLogin(data.get('email'), data.get('password'));
  });
}

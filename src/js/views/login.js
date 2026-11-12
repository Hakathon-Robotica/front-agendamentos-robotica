export function renderLogin(root, onLogin, onPublicCompetitions = () => {}) {
  root.className = 'login-screen';
  root.innerHTML = `
    <div class="login-card">
      <a class="brand brand--login" href="#inicio" aria-label="Robótica Escolar">
        <img class="brand-logo" src="src/assets/logo-joinville.png" alt="Prefeitura de Joinville">
        <span class="brand-copy"><strong>Robótica</strong><small>GESTÃO ESCOLAR</small></span>
      </a>
      <img class="login-photo" src="src/assets/images.jpg" alt="Estudantes com robô em pista de competição">
      <div class="login-heading"><p class="eyebrow">PORTAL DA ORGANIZAÇÃO</p><h1>Bem-vindo de volta</h1><p>Acesse seu espaço de trabalho.</p></div>
      <form id="login-form" class="login-form">
        <label for="email">E-mail</label><input id="email" name="email" type="email" autocomplete="username" placeholder="voce@escola.edu.br" required>
        <label for="password">Senha</label><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Sua senha" required>
        <button class="button button--primary button--wide" type="submit">Entrar no sistema <span aria-hidden="true">→</span></button>
      </form>
      <button id="public-competitions" class="public-entry" type="button">Ver competições abertas <span>→</span></button>
      <details class="demo-access"><summary>Acessos demonstrativos</summary>
        <div class="demo-list"><p><b>Administrador</b><span>admin@robotica.edu.br · admin123</span></p><p><b>Professor</b><span>professor@robotica.edu.br · prof123</span></p><p><b>Professora (outras escolas)</b><span>beatriz@robotica.edu.br · prof123</span></p><p><b>Jurado</b><span>jurado@robotica.edu.br · jurado123</span></p><p><b>Jurados (banca)</b><span>rafael@ / lucia@robotica.edu.br · jurado123</span></p></div>
      </details>
      <p class="login-footnote">Ambiente demonstrativo · dados armazenados neste navegador</p>
    </div>
    <div class="login-aside"><div class="aside-orbit orbit-one"></div><div class="aside-orbit orbit-two"></div><div class="aside-content"><span class="aside-kicker">IDEIAS QUE GANHAM MOVIMENTO</span><h2>O futuro começa<br>na sala de aula.</h2><p>Organize encontros, projetos e talentos que estão transformando o mundo.</p><div class="aside-stats"><div><strong>CRIAR</strong><span>com propósito</span></div><i></i><div><strong>INOVAR</strong><span>em equipe</span></div><i></i><div><strong>INSPIRAR</strong><span>o amanhã</span></div></div></div><span class="aside-footer">PLATAFORMA DE ROBÓTICA EDUCACIONAL</span></div>`;
  root.querySelector('#login-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onLogin(data.get('email'), data.get('password'));
  });
  root.querySelector('#public-competitions').addEventListener('click', onPublicCompetitions);
}

# Robótica Escolar · Base do sistema

Base administrativa responsiva para um sistema de gestão de competições de robótica escolar, feita com HTML, CSS e JavaScript ES Modules (ES6+), sem framework ou dependência de build.

## Executar

Sirva a pasta na raiz com um servidor estático (por exemplo, `npx serve .`) e acesse a URL local. O uso de módulos ES no navegador requer HTTP; abrir `index.html` diretamente como `file://` pode ser bloqueado pelo navegador.

## Acessos demonstrativos

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@robotica.edu.br` | `admin123` |
| Professor | `professor@robotica.edu.br` | `prof123` |
| Jurado | `jurado@robotica.edu.br` | `jurado123` |

Os usuários são semeados apenas se a coleção ainda não existir. Sessão e dados permanecem no LocalStorage deste navegador. Autenticação e senhas são demonstrativas: esta base não deve ser usada para autenticação real nem dados sensíveis.

## Inscrições e escolas

A página pública de competições pode ser acessada pela tela de entrada. Os registros de competição publicados no armazenamento são exibidos com edital, categorias e estado da janela de inscrição. O formulário cria equipes na coleção compartilhada `registrations`, com integrantes e status inicial `pendente`. O painel de inscrições permite ao professor aprovar ou rejeitar registros das escolas relacionadas ao seu `schoolIds` ou à relação `schools[].teacherIds`. O acesso administrativo de escolas pode usar a mesma coleção `schools`.

O módulo consome `EntityService` e `RegistrationService`; não cria mecanismo próprio de armazenamento ou login. Os limites são lidos dos campos de competição/categoria (`maxTeams`, `teamLimit`, `teamSizeMin`, `teamSizeMax`, `minAge`, `maxAge`, `grades` e aliases documentados no serviço). Se a branch de competições usar nomes de campo diferentes, alinhe os aliases em `src/js/services/registration-service.js`.

## Estrutura

```text
index.html
src/
  styles/main.css
  js/
    app.js                 # inicialização, estado de navegação e composição
    config.js              # nome, namespace e papéis
    contracts.js           # contratos documentais dos dados
    data/seed.js           # usuários demonstrativos e coleções vazias
    services/              # persistência, CRUD de entidade, usuários e sessão
    utils/                 # formatação e utilitários de DOM
    views/                 # login, shell administrativo e páginas-base
```

## Contratos e integração

Veja [src/js/contracts.js](src/js/contracts.js) para os formatos documentais. As coleções são `users`, `competitions`, `registrations`, `projects` e `evaluations`. Os quatro últimos começam vazios; suas telas são apenas pontos de integração.

`StorageService` centraliza todas as leituras e escritas sob o namespace versionado `robotica-escolar:v1:*`. `EntityService` oferece `list`, `findById`, `create`, `update` e `remove` para uma coleção. `UserService` estende esse padrão com busca por e-mail. `AuthService` fornece `login`, `getCurrentUser` e `logout`.

Eventos de navegação de painéis disparam `app:navigate` com o identificador da página; o shell decide as permissões de exibição do menu conforme o papel. Para adicionar uma página, registre sua rota em `views/shell.js` e seu estado vazio em `views/pages.js`.

## Limites da base

O fluxo de inscrições valida janela de inscrição, capacidade da competição/categoria, integrantes mínimos e máximos, idade e escolaridade configuradas nos dados da competição. Professores só recebem e analisam inscrições de escolas vinculadas ao seu perfil. A interface pública usa o mesmo armazenamento local compartilhado, portanto os registros deste protótipo são locais ao navegador.

Competições, avaliações e projetos continuam como áreas de integração sem regras de negócio neste módulo. A autorização no navegador serve apenas para o protótipo; um produto real precisa validar identidade, permissões, limites e persistência no servidor.

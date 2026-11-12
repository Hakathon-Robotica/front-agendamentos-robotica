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

Não há regras de negócio para competições, inscrições, avaliações ou projetos. A autorização visual de navegação é uma conveniência de interface; um produto real precisa de autenticação, autorização e persistência validadas no servidor.

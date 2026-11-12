# Robótica Escolar · Base do sistema

Base administrativa responsiva para um sistema de gestão de competições de robótica escolar, feita com HTML, CSS e JavaScript ES Modules (ES6+), sem framework ou dependência de build.

## Executar

Sirva a pasta na raiz com um servidor estático (por exemplo, `npx serve .`) e acesse a URL local. O uso de módulos ES no navegador requer HTTP; abrir `index.html` diretamente como `file://` pode ser bloqueado pelo navegador.

## Apresentação

A pasta `apresentacao/` contém uma apresentação do projeto em HTML, CSS e JS (sem dependências). Com o servidor rodando, acesse `/apresentacao/`. Navegue com as setas, deslizando no celular ou pelos botões; `F` alterna a tela cheia e clicar em uma captura de tela a amplia.

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

Veja [src/js/contracts.js](src/js/contracts.js) para os formatos documentais. As coleções são `users`, `schools`, `competitions`, `categories`, `notices`, `registrations`, `projects` e `evaluations`.

### Cadastro de equipes

Uma equipe é uma inscrição (`registrations`) numa competição com inscrições abertas (edital publicado + inscrições abertas).

- **Portal público:** qualquer pessoa inscreve uma equipe; ela fica `pendente` até o professor da escola aprovar.
- **Painel (Equipes e inscrições):** administrador e professor cadastram, editam e excluem equipes. O professor só vê e gerencia equipes das escolas às quais está vinculado. Equipes cadastradas pelo painel já entram `aprovado`.
- **Escolas (somente administrador):** cadastro de escolas e vínculo de professores. Escolas com equipes não podem ser excluídas.
- Regras validadas: categoria, número de integrantes, faixa etária, escolaridade, limite de equipes e nome de equipe único por competição.

## Dados de demonstração

`data/demo-data.js` é aplicado uma única vez (chave `demoSeed`), sem sobrescrever dados existentes:

- **Copa Joinville de Robótica 2026** (em andamento): 21 equipes aprovadas, notas de 3 jurados; o jurado demo ainda tem equipes pendentes.
- **Festival Estudantil de Tecnologia** (em andamento): 14 equipes aprovadas, parcialmente avaliadas.
- **Torneio de Inverno de Robótica 2027** (inscrições abertas): equipes pendentes para os professores aprovarem.
- Todas usam as 7 categorias padrão. Logins extras: `beatriz@robotica.edu.br / prof123`, `rafael@robotica.edu.br` e `lucia@robotica.edu.br / jurado123`.

Para recriar os dados, limpe o LocalStorage do site (DevTools → Application → Local Storage).

## Notas dos jurados

Em **Avaliações**, o jurado escolhe a competição e a categoria e avalia cada equipe **aprovada** com notas de 0 a 10 em quatro critérios fixos (Desempenho, Projeto e inovação, Apresentação, Trabalho em equipe), mais observações opcionais. Cada jurado tem uma avaliação por equipe (pode editar). A média final da equipe é a média das médias dos jurados; o administrador vê a classificação por categoria. Critérios e cálculo ficam em `services/evaluation-service.js`; as notas são gravadas em `evaluations` com `registrationId`, `judgeId` e `scores`.

`StorageService` centraliza todas as leituras e escritas sob o namespace versionado `robotica-escolar:v1:*`. `EntityService` oferece `list`, `findById`, `create`, `update` e `remove` para uma coleção. `UserService` estende esse padrão com busca por e-mail. `AuthService` fornece `login`, `getCurrentUser` e `logout`.

Eventos de navegação de painéis disparam `app:navigate` com o identificador da página; o shell decide as permissões de exibição do menu conforme o papel. Para adicionar uma página, registre sua rota em `views/shell.js` e seu estado vazio em `views/pages.js`.

## Limites da base

A autorização visual de navegação é uma conveniência de interface; um produto real precisa de autenticação, autorização e persistência validadas no servidor.

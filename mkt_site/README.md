# Yu-Gi-Oh! FB Catalog - Site

Interface web do catálogo Yu-Gi-Oh! Forbidden Memories: uma SPA estática feita com Vite, React e CSS puro, publicada no GitHub Pages.

## O que existe hoje

- Cabeçalho com logo, menu de páginas (vira um botão no celular), versão do catálogo usada no build (clique para copiar `@mhsalves/yugioh-fb-catalog@<versão>`) e link para essa versão no npm
- Página inicial provisória ("Hello, duelist!")
- Página 404 para endereços desconhecidos

As próximas páginas seguem a [spec 06](../docs/specs/06-site-ux-forbidden-memories.md).

## Tecnologias

- [Vite](https://vite.dev/) + [React](https://react.dev/)
- CSS puro com variáveis em `src/styles.css` (sem biblioteca de UI)
- Roteador próprio em `src/router.tsx` (sem biblioteca de rotas)
- [@mhsalves/yugioh-fb-catalog](../catalog/README.md) (cópia local do workspace)

## Desenvolvimento local

### Pré-requisitos

- Node.js 22 (veja `.nvmrc` na raiz)
- Yarn 1

### Configuração

O site é um workspace Yarn e usa o catálogo local (`../catalog`), não a versão publicada no npm. Rode os comandos **na raiz do repositório**:

```bash
# Instalar dependências (um único yarn.lock na raiz)
yarn install

# Compilar o catálogo e iniciar o site; mudanças em catalog/src aparecem na hora
yarn dev
```

O site estará disponível em `http://localhost:5173`.

### Scripts (dentro de `mkt_site/`)

O catálogo precisa estar compilado antes (`yarn build` na raiz cria `catalog/lib/`).

- `yarn dev`: inicia o servidor de desenvolvimento
- `yarn build`: gera o site estático em `dist/`
- `yarn preview`: serve `dist/` em `http://localhost:4173/yugioh-fb-catalog/`
- `yarn typecheck`: verifica os tipos (TypeScript strict)

## Adicionar uma página

1. Crie o componente em `src/pages/`.
2. Registre a rota em `src/routes.ts`. Ela aparece no menu do cabeçalho.
3. Use `<Link to="/caminho">` de `src/router.tsx` para links internos (nunca `href="/..."` fixo, por causa do base path).

## Deploy

O deploy é automático: depois de um merge na `main` que muda o site (`mkt_site/**`), os dados ou o código do catálogo, ou as dependências, o workflow `.github/workflows/pages.yml` valida, testa, gera o build e publica no GitHub Pages. Para publicar de novo sem mudanças, rode o workflow pela aba **Actions** (`workflow_dispatch`).

O site fica em `https://mhsalves.github.io/yugioh-fb-catalog`.

- O base path vem de `SITE_BASE_PATH` (padrão `/yugioh-fb-catalog` no build e no preview, `/` no dev). Para um domínio próprio, use `SITE_BASE_PATH=/ yarn build`.
- O build copia `index.html` para `404.html`, assim links diretos (por exemplo `/yugioh-fb-catalog/qualquer-pagina`) carregam a SPA no GitHub Pages.

## Estrutura

```
mkt_site/
├── index.html           # Shell da SPA
├── vite.config.ts       # Base path, 404.html, versão do catálogo
└── src/
    ├── main.tsx         # Entrada
    ├── App.tsx          # Cabeçalho + página da rota atual
    ├── routes.ts        # Lista de páginas (alimenta o menu)
    ├── router.tsx       # usePath, navigate, <Link>
    ├── styles.css       # Tokens e estilos globais
    ├── assets/logo.svg
    ├── components/      # Header, CatalogVersion, ícones
    └── pages/           # HomePage, NotFoundPage
```

## Licença

MIT

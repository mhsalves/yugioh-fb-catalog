# Yu-Gi-Oh! FB Catalog - Site

Interface web do catálogo Yu-Gi-Oh! Forbidden Memories: uma SPA estática feita com Vite, React e CSS puro, publicada no GitHub Pages.

## O que existe hoje

Mobile-first ([spec 10](../docs/specs/10-site-feature-shell-mobile-first.md)): o layout base é o do celular, e telas maiores somam a ele com `min-width`. Com mais de uma página visível, aparece uma barra de abas embaixo no celular (no desktop, abas no cabeçalho).

| Página | Endereço | Estado |
|---|---|---|
| Cartas (catálogo) | `/` | No ar |
| Busca rápida (nome, número ou senha) | `/search` | No ar |
| Fusões | `/fusion` | Prévia com dados de exemplo |
| Duelistas | `/duelists`, `/duelists/<id>` | Prévia com dados de exemplo |

As prévias aparecem no `yarn dev` ou abrindo qualquer página com `?preview=1` (vale para a sessão do navegador; `?preview=0` desliga). Em produção, sem isso, elas dão 404 e não entram no sitemap.

O catálogo ([spec 09](../docs/specs/09-site-catalog-page.md)):

- Cabeçalho com logo (volta ao catálogo completo), versão do catálogo usada no build (clique para copiar `@mhsalves/yugioh-fb-catalog@<versão>`) e link para essa versão no npm
- Busca por nome, filtro **By type** ("All types" + os 5 tipos de carta) e um painel com os outros filtros (tipo de monstro, guardian star, level, ATK, DEF, custo); no celular o painel abre em tela cheia
- Resultados em grade, vindos de `searchCards` do catálogo; sem resultados aparece um placeholder com "Clear filters"
- Clique numa carta para abrir os detalhes (atributos, guardian stars, senha com botão de copiar, custo, descrição, ritual)
- Filtros e carta aberta ficam na URL (`?type=Monster&card=425`), então dá para compartilhar
- Rodapé com links para https://matheusalves.dev e https://github.com/mhsalves e o aviso "Unofficial fan project. Yu-Gi-Oh! is a trademark of Konami."
- Botão **Share** nos detalhes da carta: compartilha (celular) ou copia o link da página da carta, `/cards/<id>/`
- A página da carta só é usada por esse link compartilhado: mostra a carta sozinha, com "Back to the catalog" para voltar ao catálogo. O build gera uma por carta catalogada (com título, descrição e link canônico próprios) e um `sitemap.xml`
- Página 404 para outros endereços

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

## Métodos simulados (mock)

Alguns métodos que o site usa ainda não existem no catálogo. O site simula cada um em `src/data/` com a assinatura planejada para o catálogo, e todos estão listados em **`src/data/pending.ts`** (e na [spec 04](../docs/specs/04-catalog-query-api.md) Q-5) para serem adicionados ao catálogo depois:

- Fusões: `getFusion`, `getFusionsWith`, `getFusionsFor` (`src/data/fusions.ts`)
- Duelistas: `getDuelistList`, `getDuelist`, `getDropsFrom`, `getDroppedBy`, `getDeckOf` (`src/data/duelists.ts`)
- Senha: `getCardByPassword` (`src/data/cards.ts`, com os dados reais)

Os dados de exemplo (`src/data/sample.ts`) usam as cartas reais, mas as fusões, duelistas e taxas são inventados; as páginas em prévia mostram um aviso dizendo isso. Quando o catálogo ganhar um desses métodos: reexporte-o no adaptador em `src/data/`, apague o mock e a entrada em `pending.ts`, e mude a rota para `"live"` em `src/routes.ts` quando todos os métodos da página forem reais.

## Regras

- Filtrar e ordenar cartas é trabalho do catálogo (`searchCards`); o site só monta a consulta e mostra o resultado.
- Use `<Link to="/...">` e `navigate()` de `src/router.tsx` para links internos (nunca `href="/..."` fixo, por causa do base path).

## Deploy

O deploy é automático: depois de um merge na `main` que muda o site (`mkt_site/**`), os dados ou o código do catálogo, ou as dependências, o workflow `.github/workflows/pages.yml` valida, testa, gera o build e publica no GitHub Pages. Para publicar de novo sem mudanças, rode o workflow pela aba **Actions** (`workflow_dispatch`).

O site fica em `https://mhsalves.github.io/yugioh-fb-catalog`.

- O base path vem de `SITE_BASE_PATH` (padrão `/yugioh-fb-catalog` no build e no preview, `/` no dev). Para um domínio próprio, use `SITE_BASE_PATH=/ yarn build`.
- O build copia `index.html` para `404.html`, assim links diretos (por exemplo `/yugioh-fb-catalog/qualquer-pagina`) carregam a SPA no GitHub Pages.

## Estrutura

```
mkt_site/
├── index.html           # Shell da SPA
├── vite.config.ts       # Base path, 404.html, páginas por carta, versão do catálogo
├── build/cardPages.ts   # Gera cards/<id>/index.html, páginas das rotas no ar e sitemap.xml no build
└── src/
    ├── main.tsx         # Entrada (importa os CSS na ordem da cascata)
    ├── App.tsx          # Cabeçalho, página da rota (ou 404) e rodapé
    ├── routes.ts        # Lista de páginas e estado de cada uma (live / preview / hidden)
    ├── features.ts      # Flag de prévia (?preview=1)
    ├── router.tsx       # usePath, useSearch, navigate, <Link>, posição de rolagem no Voltar
    ├── urlParams.ts     # useUrlParams, useCardParam (?card= em qualquer página)
    ├── catalogUrl.ts    # Query string ⇄ CardQuery
    ├── useCopy.ts       # Copiar para a área de transferência
    ├── styles/          # tokens, base, layout, catalog, card-panel, features, motion (mobile-first)
    ├── data/            # Adaptadores com mocks (fusions, duelists, cards), sample.ts, pending.ts
    ├── assets/logo.svg
    ├── components/      # Header, Nav, Footer, Filters, CardTile, CardRow, CardDetails, CardInfo, Sheet, CardPicker, Tabs, ...
    └── pages/           # CatalogPage, SearchPage, FusionPage, DuelistsPage, DuelistPage, CardPage, NotFoundPage
```

## Licença

MIT

# Yu-Gi-Oh! Forbidden Memories Catalog

Este é um catálogo completo de cartas do jogo Yu-Gi-Oh! Forbidden Memories, lançado em 1999 para PlayStation 1. O projeto fornece uma biblioteca npm para acesso aos dados das cartas e um site para consulta.

🌐 **Site do catálogo:** [matheusalves.dev/yugioh-fm-catalog](https://matheusalves.dev/yugioh-fm-catalog)

## Módulos

O repositório é um workspace Yarn com dois módulos:

| Módulo | O que é | Linguagens e tecnologias | Documentação | Link |
|---|---|---|---|---|
| **Catalog** (`catalog/`) | Biblioteca npm com os dados das cartas e uma API de consulta tipada | TypeScript, JSON + JSON Schema, Zod, Vitest | [catalog/README.md](./catalog/README.md) | [npm](https://www.npmjs.com/package/@mhsalves/yugioh-fb-catalog) |
| **MKT Site** (`mkt_site/`) | Site público do catálogo, publicado no GitHub Pages | TypeScript, React, Vite, CSS puro | [mkt_site/README.md](./mkt_site/README.md) | [Site](https://matheusalves.dev/yugioh-fm-catalog) |

### Catalog

Pacote npm [`@mhsalves/yugioh-fb-catalog`](https://www.npmjs.com/package/@mhsalves/yugioh-fb-catalog): os dados de todas as 722 cartas (monstros, Magic, Equip, Trap e Ritual), as receitas de ritual e as regras do jogo (guardian stars e bônus de batalha), com funções puras e síncronas para consultá-los. Os dados ficam em JSON (`catalog/data/`), validados por JSON Schema e Zod, e são empacotados na biblioteca, sem chamadas de rede.

- **Linguagens:** TypeScript (compilado com `tsc`), dados em JSON
- **Ferramentas:** Vitest (testes), Zod e JSON Schema (validação), tsx (scripts de dados)
- **Documentação:** [catalog/README.md](./catalog/README.md) (uso e API), [catalog/docs/DATA.md](./catalog/docs/DATA.md) (modelo de dados), [catalog/CONTRIBUTING-DATA.md](./catalog/CONTRIBUTING-DATA.md) (como cadastrar dados), [catalog/CHANGELOG.md](./catalog/CHANGELOG.md)
- **Link:** [npmjs.com/package/@mhsalves/yugioh-fb-catalog](https://www.npmjs.com/package/@mhsalves/yugioh-fb-catalog)

```bash
npm install @mhsalves/yugioh-fb-catalog
# ou
yarn add @mhsalves/yugioh-fb-catalog
```

### MKT Site

Site do catálogo: uma SPA estática, mobile-first, para buscar e filtrar as cartas, ver os detalhes de cada uma e compartilhar o link da carta. Usa o módulo Catalog local do workspace e é publicado automaticamente no GitHub Pages a cada merge na `main`.

- **Linguagens:** TypeScript, React (TSX), CSS puro (sem biblioteca de UI)
- **Ferramentas:** Vite (dev server e build), roteador próprio, GitHub Actions + GitHub Pages (deploy)
- **Documentação:** [mkt_site/README.md](./mkt_site/README.md)
- **Link:** [matheusalves.dev/yugioh-fm-catalog](https://matheusalves.dev/yugioh-fm-catalog)

## Documentação geral

- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md): arquitetura, decisões de design e roadmap
- [docs/specs](./docs/specs/README.md): especificações do catálogo e do site

## Desenvolvimento

O repositório é um workspace Yarn 1 (`catalog/` e `mkt_site/`) com um único `yarn.lock` na raiz. Use Node 22 (veja `.nvmrc`).

```bash
yarn install          # instala tudo na raiz
yarn dev              # site em http://localhost:5173 usando o catálogo local (atualiza ao editar catalog/src)
yarn typecheck        # TypeScript (strict) nos dois pacotes
yarn lint             # ESLint
yarn format:check     # Prettier (yarn format para corrigir)
yarn test             # Vitest: API de consulta + integridade dos dados
yarn validate         # valida os JSON em catalog/data (veja catalog/CONTRIBUTING-DATA.md)
yarn coverage:data    # quantas cartas já foram cadastradas
yarn build            # build do catálogo e do site
```

Cada PR passa pelo CI (`.github/workflows/ci.yml`).

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Autor

Matheus Alves - [@mhsalves](https://github.com/mhsalves)

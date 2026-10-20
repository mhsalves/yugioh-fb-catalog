# Yu-Gi-Oh! Forbidden Memories Catalog

Este é um catálogo completo de cartas do jogo Yu-Gi-Oh! Forbidden Memories, lançado em 1999 para PlayStation 1. O projeto fornece uma biblioteca npm para acesso aos dados das cartas e uma interface web para consulta.

## Visão Geral do Projeto

O projeto está dividido em dois componentes principais, cada um com seu próprio README detalhado:

1. **[Biblioteca e Catálogo de Dados](./catalog/README.md)** (`catalog/`)
   - Pacote npm: `@mhsalves/yugioh-fb-catalog`
   - Base de dados estruturada das cartas e acesso programático a ela
   - [Documentação do Catálogo](./catalog/README.md)

2. **[Site](./mkt_site/README.md)** (`mkt_site/`)
   - Interface visual do catálogo, publicada no GitHub Pages
   - Desenvolvido com Vite, React e CSS puro
   - [Documentação do Site](./mkt_site/README.md)

Para a arquitetura, as decisões de design e o roadmap de melhorias, veja [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Início Rápido

```bash
# Instalar a biblioteca via npm
npm install @mhsalves/yugioh-fb-catalog

# Ou via yarn
yarn add @mhsalves/yugioh-fb-catalog
```

Para acessar a interface web, visite: [Yu-Gi-Oh! FB Catalog](https://mhsalves.github.io/yugioh-fb-catalog)

## Desenvolvimento

O repositório é um workspace Yarn 1 (`catalog/` e `mkt_site/`) com um único `yarn.lock` na raiz. Use Node 22 (veja `.nvmrc`).

```bash
yarn install          # instala tudo na raiz
yarn dev              # site em http://localhost:3000 usando o catálogo local (atualiza ao editar catalog/src)
yarn typecheck        # TypeScript (strict) nos dois pacotes
yarn lint             # ESLint
yarn format:check     # Prettier (yarn format para corrigir)
yarn test             # Vitest: API de consulta + integridade dos dados
yarn validate         # valida os JSON em catalog/data (veja catalog/CONTRIBUTING-DATA.md)
yarn coverage:data    # quantas cartas já foram cadastradas
yarn build            # build do catálogo e do site
```

Cada PR passa pelo CI (`.github/workflows/ci.yml`). As especificações ficam em [docs/specs](./docs/specs/README.md).

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Autor

Matheus Alves - [@mhsalves](https://github.com/mhsalves)

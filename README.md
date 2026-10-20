# Yu-Gi-Oh! Forbidden Memories Catalog

Este é um catálogo completo de cartas do jogo Yu-Gi-Oh! Forbidden Memories, lançado em 1999 para PlayStation 1. O projeto fornece uma biblioteca npm para acesso aos dados das cartas e uma interface web para consulta.

## Visão Geral do Projeto

O projeto está dividido em dois componentes principais, cada um com seu próprio README detalhado:

1. **[Biblioteca e Catálogo de Dados](./catalog/README.md)** (`catalog/`)
   - Pacote npm: `@mhsalves/yugioh-fb-catalog`
   - Base de dados estruturada das cartas e acesso programático a ela
   - [Documentação do Catálogo](./catalog/README.md)

2. **[Servidor Web](./server/README.md)** (`server/`)
   - Interface visual do catálogo
   - Desenvolvido com Next.js e Material-UI
   - [Documentação do Servidor](./server/README.md)

Para a arquitetura, as decisões de design e o roadmap de melhorias, veja [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Início Rápido

```bash
# Instalar a biblioteca via npm
npm install @mhsalves/yugioh-fb-catalog

# Ou via yarn
yarn add @mhsalves/yugioh-fb-catalog
```

Para acessar a interface web, visite: [Yu-Gi-Oh! FB Catalog](https://mhsalves.github.io/yugioh-fb-catalog)

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Autor

Matheus Alves - [@mhsalves](https://github.com/mhsalves)

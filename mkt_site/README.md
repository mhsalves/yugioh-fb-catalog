# Yu-Gi-Oh! FB Catalog - Servidor Web

Interface web do catálogo Yu-Gi-Oh! Forbidden Memories, desenvolvida com Next.js e Material-UI.

## Funcionalidades

- 🎴 Visualização de todas as cartas do jogo
- 🔍 Busca avançada por nome, tipo e atributos
- 📱 Interface responsiva para desktop e mobile
- 🌓 Tema claro/escuro
- 📊 Estatísticas e informações detalhadas

## Tecnologias

- [Next.js](https://nextjs.org/)
- [Material-UI](https://mui.com/)
- [Emotion](https://emotion.sh/)
- [@mhsalves/yugioh-fb-catalog](../README.md)

## Desenvolvimento Local

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

O site estará disponível em `http://localhost:3000`

### Scripts Disponíveis (dentro de `mkt_site/`)

O catálogo precisa estar compilado antes (`yarn build` na raiz cria `catalog/lib/`).

- `yarn dev`: Inicia o site em modo desenvolvimento (sem observar o catálogo)
- `yarn typecheck`: Verifica os tipos (TypeScript strict)
- `yarn build`: Constrói o projeto para produção
- `yarn start`: Inicia o servidor em modo produção
- `yarn gh:deploy`: Faz deploy para GitHub Pages

## Deploy

### GitHub Pages

```bash
# Construir e fazer deploy
yarn gh:deploy
```

O site estará disponível em: `https://mhsalves.github.io/yugioh-fb-catalog`

### Hospedagem Personalizada

1. Construa o projeto:
```bash
yarn build
```

2. Os arquivos estáticos estarão na pasta `out`

## Estrutura do Projeto

```
mkt_site/
├── src/
│   ├── components/    # Componentes React reutilizáveis
│   ├── pages/        # Páginas Next.js
│   ├── styles/       # Estilos globais e temas
│   └── utils/        # Utilitários e helpers
├── public/           # Arquivos estáticos
└── package.json
```

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=sua_url_api
```

## Licença

MIT

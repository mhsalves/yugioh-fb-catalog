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

- Node.js (versão recomendada: 16+)
- Yarn ou npm

### Configuração

```bash
# Instalar dependências
yarn install

# Iniciar servidor de desenvolvimento
yarn dev
```

O servidor estará disponível em `http://localhost:3000`

### Scripts Disponíveis

- `yarn dev`: Inicia o servidor em modo desenvolvimento
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
server/
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

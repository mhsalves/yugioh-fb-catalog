# Biblioteca Principal Yu-Gi-Oh! FB Catalog

Biblioteca core do projeto Yu-Gi-Oh! Forbidden Memories Catalog, responsável pela lógica principal e manipulação dos dados das cartas do jogo.

## Estrutura do Código

```
src/
├── index.ts           # Ponto de entrada e exportações principais
├── data/             # Dados e tipos base
│   ├── card-types.ts # Definições de tipos de carta
│   └── cards/        # Implementação das cartas
│       ├── monsters/ # Cartas de monstro
│       ├── rituals/  # Cartas de ritual
│       └── support/  # Cartas de suporte
└── tools/            # Utilitários e ferramentas
    └── cards.ts      # Funções de manipulação de cartas
```

## Uso da Biblioteca

```typescript
import { getCards, getCardById, getCardsByType } from '@mhsalves/yugioh-fb-catalog';

// Obter todas as cartas
const allCards = getCards();

// Obter carta por ID
const blueEyesCard = getCardById('blue-eyes-white-dragon');

// Obter cartas por tipo
const thunderCards = getCardsByType('thunder');
```

## API Principal

### Funções

#### `getCards()`
- **Descrição**: Retorna todas as cartas disponíveis no catálogo
- **Retorno**: `Card[]`

#### `getCardById(id: string)`
- **Descrição**: Retorna uma carta específica pelo seu ID
- **Parâmetros**: 
  - `id`: Identificador único da carta
- **Retorno**: `Card | undefined`

#### `getCardsByType(type: CardType)`
- **Descrição**: Retorna todas as cartas de um determinado tipo
- **Parâmetros**:
  - `type`: Tipo da carta (thunder, ritual, magic, etc)
- **Retorno**: `Card[]`

### Tipos Principais

```typescript
interface Card {
  id: string;
  name: string;
  type: CardType;
  description?: string;
}

interface MonsterCard extends Card {
  type: 'monster';
  subtype: MonsterType;
  attack: number;
  defense: number;
  attribute: CardAttribute;
  level: number;
}

interface RitualCard extends Card {
  type: 'ritual';
  requirements: string[];
  result: string;
}

interface SupportCard extends Card {
  type: 'equip' | 'magic' | 'trap';
  effect: string;
}

type CardType = 'monster' | 'ritual' | 'equip' | 'magic' | 'trap';
type MonsterType = 'thunder' | 'dragon' | 'warrior' | 'spellcaster' | /* outros */;
type CardAttribute = 'light' | 'dark' | 'fire' | 'water' | 'earth' | 'wind';
```

## Desenvolvimento

### Requisitos

- Node.js (versão recomendada: 16+)
- Yarn ou npm

### Configuração Local

```bash
# Instalar dependências
yarn install

# Verificar tipos
yarn tsc --noEmit

# Construir a biblioteca
yarn npm:build
```

### Scripts Disponíveis

- `yarn npm:build`: Limpa a pasta lib e compila o TypeScript
- `yarn npm:publish`: Constrói e publica a biblioteca no npm

## Contribuição

1. Faça um fork do projeto
2. Crie sua branch de feature (`git checkout -b feature/nova-feature`)
3. Faça commit das mudanças (`git commit -am 'Adiciona nova feature'`)
4. Faça push para a branch (`git push origin feature/nova-feature`)
5. Crie um Pull Request

### Diretrizes de Código

- Mantenha a tipagem forte em todo o código
- Documente novas funções e tipos
- Mantenha a estrutura de pastas organizada
- Adicione testes para novas funcionalidades

## Integração com Outros Módulos

- **Catálogo**: Esta biblioteca consome os dados do módulo `catalog`
- **Servidor**: O servidor web utiliza esta biblioteca para acessar os dados

## Licença

MIT

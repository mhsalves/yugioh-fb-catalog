# Yu-Gi-Oh! FB Catalog - Catálogo de Dados

Base de dados estruturada das cartas do Yu-Gi-Oh! Forbidden Memories, contendo informações detalhadas sobre todas as cartas do jogo.

## Uso

```ts
import { getCard, getCardsByMonsterType, getRitual, TOTAL_CARDS, MONSTER_TYPES } from "@mhsalves/yugioh-fb-catalog";

getCard(425); // Thunder Dragon
getCardsByMonsterType("Thunder"); // IMonsterCard[]
getRitual(674); // { ritual: 674, result: 365, materials: [186, 261, 595] }
TOTAL_CARDS; // 722
MONSTER_TYPES; // os 20 tipos de monstro do jogo
```

Mudanças entre versões (incluindo a migração para a `0.2.0`) estão no [CHANGELOG](./CHANGELOG.md).

## Estrutura dos Dados

Uma regra só: cada carta vai no arquivo do seu `cardType`, e cada monstro no arquivo do seu tipo de monstro.

```
catalog/src/data/
├── enums.ts                  # MONSTER_TYPES, CARD_TYPES, GUARDIAN_STARS
├── rules.ts                  # TOTAL_CARDS, vantagem e bônus das guardian stars
├── card-types.ts             # Tipos das cartas
├── relation-types.ts         # Tipos das relações (fusões, rituais, equips, campos)
├── cards/
│   ├── monsters/<tipo>.ts    # Um arquivo por tipo de monstro (ex.: thunder.ts)
│   ├── magic.ts
│   ├── trap.ts
│   ├── equip.ts
│   └── ritual.ts
├── rituals.ts                # Receitas de ritual
├── fusions/                  # Fusões (pares de cartas)
├── equips.ts                 # Compatibilidade de equips
└── fields.ts                 # Efeitos de campo
```

## Formato dos Dados

`id` é o número da carta no jogo (1 a 722). Referências entre cartas usam esse número.

### Carta de Monstro

```typescript
interface IMonsterCard {
  id: number;
  name: string;
  description: string;
  password: { code: string; cost: number }; // code: 8 dígitos; cost: starchips
  cardType: "Monster";
  monsterType: TMonsterType; // "Dragon", "Thunder", ... (MONSTER_TYPES)
  level: number; // 1 a 12
  attack: number;
  defense: number;
  guardianStars: [TGuardianStar, TGuardianStar];
}
```

### Cartas Mágica, Armadilha, Equip e Ritual

```typescript
interface IMagicCard { id; name; description; password; cardType: "Magic" }
interface ITrapCard { id; name; description; password; cardType: "Trap" }
interface IEquipCard { id; name; description; password; cardType: "Equip" }
interface IRitualCard { id; name; description; password; cardType: "Ritual" }
```

### Relações

```typescript
interface IRitual { ritual: number; result: number; materials: number[] } // em rituals.ts
interface IFusion { materials: [number, number]; result: number } // par ordenado (a <= b)
```

## Contribuindo com Dados

### Adicionando Novas Cartas

1. Encontre o arquivo pelo `cardType` (monstros: `cards/monsters/<tipo>.ts`; crie o arquivo e adicione-o em `cards/monsters/index.ts` se for o primeiro monstro do tipo).
2. Adicione o objeto seguindo o formato das cartas existentes.
3. Para uma carta de ritual, adicione também a receita em `rituals.ts`.
4. Rode as verificações na raiz do repositório.

### Validação

```bash
yarn install
yarn typecheck   # tipos (um monstro no arquivo de outro tipo é erro de tipo)
yarn test        # integridade dos dados: IDs únicos, faixas de valores, referências
```

## Licença

MIT

# Yu-Gi-Oh! FB Catalog - Catálogo de Dados

Base de dados estruturada das cartas do Yu-Gi-Oh! Forbidden Memories, contendo informações detalhadas sobre todas as cartas do jogo.

## Uso

```ts
import { getCard, getCardsByMonsterType, getRitual, searchCards, TOTAL_CARDS, MONSTER_TYPES } from "@mhsalves/yugioh-fb-catalog";

getCard(425); // Thunder Dragon
searchCards({ text: "dragon", cardType: "Monster", attack: { min: 1000 }, sort: { by: "attack", dir: "desc" } });
// { total, items } — todos os campos são opcionais e combinam com E (veja `CardQuery`)
getCardsByMonsterType("Thunder"); // IMonsterCard[]
getRitual(674); // { ritual: 674, result: 365, materials: [186, 261, 595] }
TOTAL_CARDS; // 722
MONSTER_TYPES; // os 20 tipos de monstro do jogo
```

Mudanças entre versões (incluindo a migração para a `0.2.0`) estão no [CHANGELOG](./CHANGELOG.md).

## Estrutura dos Dados

Os dados ficam em arquivos **JSON** em `catalog/data/`, validados por esquemas em `catalog/schema/`. Uma regra só: cada carta vai no arquivo do seu `cardType`, e cada monstro no arquivo do seu tipo de monstro.

```
catalog/
├── data/                         # Só dados (JSON)
│   ├── cards/
│   │   ├── monsters/<tipo>.json  # Um arquivo por tipo de monstro (ex.: thunder.json)
│   │   ├── magic.json
│   │   ├── trap.json
│   │   ├── equip.json
│   │   └── ritual.json
│   ├── rituals.json              # Receitas de ritual
│   ├── fusions/<tipo>.json       # Fusões (pares de cartas), pelo tipo do resultado
│   ├── equips.json               # Compatibilidade de equips
│   ├── fields.json               # Efeitos de campo
│   └── rules.json                # Total de cartas, vantagem e bônus das guardian stars
├── schema/                       # Esquemas Zod e os JSON Schemas gerados ($schema dos arquivos)
├── scripts/                      # validate, data:build, schema:build, coverage:data
└── src/                          # API de consulta e tipos públicos
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

Adicionar uma carta é editar **um arquivo JSON** em `catalog/data/`, sem mexer em código. O guia completo, com modelos para copiar, está em [CONTRIBUTING-DATA.md](./CONTRIBUTING-DATA.md).

```bash
yarn validate        # na raiz: verifica todos os arquivos de dados
yarn coverage:data   # quantas cartas já foram cadastradas
```

## Licença

MIT

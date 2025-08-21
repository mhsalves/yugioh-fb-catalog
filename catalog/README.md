# Yu-Gi-Oh! FB Catalog - Catálogo de Dados

Base de dados estruturada das cartas do Yu-Gi-Oh! Forbidden Memories, contendo informações detalhadas sobre todas as cartas do jogo.

## Estrutura dos Dados

```
catalog/
├── src/
│   ├── data/
│   │   ├── card-types.ts       # Definição dos tipos de carta
│   │   └── cards/             # Dados das cartas
│   │       ├── monsters/      # Cartas de monstro
│   │       │   └── thunders/  # Monstros do tipo Thunder
│   │       ├── rituals/       # Cartas de ritual
│   │       └── support/       # Cartas de suporte
│   │           ├── equip.ts   # Cartas de equipamento
│   │           ├── magic.ts   # Cartas mágicas
│   │           └── trap.ts    # Cartas armadilha
│   └── index.ts               # Ponto de entrada
```

## Formato dos Dados

### Carta de Monstro

```typescript
interface MonsterCard {
  id: string;
  name: string;
  type: 'monster';
  subtype: 'thunder' | 'dragon' | /* outros tipos */;
  attack: number;
  defense: number;
  attribute: 'light' | 'dark' | /* outros atributos */;
  level: number;
  description?: string;
}
```

### Carta de Ritual

```typescript
interface RitualCard {
  id: string;
  name: string;
  type: 'ritual';
  requirements: string[];
  result: string;
  description: string;
}
```

### Carta de Suporte

```typescript
interface SupportCard {
  id: string;
  name: string;
  type: 'equip' | 'magic' | 'trap';
  effect: string;
  description: string;
}
```

## Contribuindo com Dados

### Adicionando Novas Cartas

1. Identifique o tipo correto da carta
2. Adicione os dados no arquivo apropriado seguindo o formato existente
3. Atualize os índices se necessário
4. Verifique a validação de tipos

### Validação

```bash
# Instalar dependências
yarn install

# Verificar tipos
yarn tsc --noEmit
```

### Diretrizes

- Mantenha a consistência com o formato existente
- Inclua todas as informações disponíveis
- Use IDs únicos e descritivos
- Mantenha os dados organizados por categoria

## Referências

- [Guia Oficial Yu-Gi-Oh! Forbidden Memories](URL)
- [Wiki Yu-Gi-Oh! Forbidden Memories](URL)
- [Base de Dados Original](URL)

## Licença

MIT

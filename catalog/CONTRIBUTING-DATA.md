# Contribuindo com dados do catálogo

Todos os dados ficam em arquivos **JSON** dentro de `catalog/data/`. Para adicionar ou corrigir uma carta, você só edita **um arquivo JSON**: não é preciso mexer em código, `index.ts` ou tipos. Dá para fazer tudo pela interface web do GitHub.

## Onde cada dado fica

| O que | Arquivo |
|---|---|
| Monstro | `data/cards/monsters/<tipo>.json` (ex.: `thunder.json`, `winged-beast.json`, `beast-warrior.json`) |
| Mágica | `data/cards/magic.json` |
| Armadilha | `data/cards/trap.json` |
| Equip | `data/cards/equip.json` |
| Ritual (a carta) | `data/cards/ritual.json` |
| Receita de ritual | `data/rituals.json` |
| Fusão | `data/fusions/<tipo do monstro resultante>.json` |
| Compatibilidade de equip | `data/equips.json` |
| Efeito de campo | `data/fields.json` |
| Regras do jogo | `data/rules.json` (total de cartas, guardian stars) |

O nome do arquivo de um tipo de monstro é o tipo em minúsculas, com `-` no lugar de espaços. Os 20 tipos são: `dragon`, `spellcaster`, `zombie`, `warrior`, `beast-warrior`, `beast`, `winged-beast`, `fiend`, `fairy`, `insect`, `dinosaur`, `reptile`, `fish`, `sea-serpent`, `machine`, `thunder`, `aqua`, `pyro`, `rock`, `plant`. Se o arquivo do tipo ainda não existe, crie-o com o modelo abaixo.

Duelistas e drops ainda não têm formato definido (spec 02, TBD-D9).

**Imagens** ficam em `data/images.json`: `{ "card": 425, "source": "fandom", "url": "<endereço da imagem>" }`, com a URL copiada da wiki (mantenha o `?cb=`). O `validate` confere o host e se a pasta `<h>/<hh>` da URL bate com o nome do arquivo, o que pega URLs digitadas errado. O `yarn data:sync` preenche tudo; à mão, só quando uma imagem mudar.

## Modelos para copiar

Cada arquivo é um objeto com `$schema` e uma lista. O `$schema` aponta para o esquema em `catalog/schema/`: com ele, o VS Code completa os campos e marca erros enquanto você digita.

### Monstro (`data/cards/monsters/dragon.json`)

```json
{
  "$schema": "../../../schema/monster-list.schema.json",
  "cards": [
    {
      "id": 1,
      "name": "Blue-eyes White Dragon",
      "description": "Texto da carta no jogo.",
      "cardType": "Monster",
      "password": { "code": "89631139", "cost": 999999 },
      "monsterType": "Dragon",
      "level": 8,
      "attack": 3000,
      "defense": 2500,
      "guardianStars": ["Sun", "Mars"]
    }
  ]
}
```

- `id`: número da carta no jogo (1 a 722).
- `password.code`: 8 dígitos, como texto (mantém zeros à esquerda). `password.cost`: starchips, de 0 a 999999. Cartas que o jogo não vende por senha (monstros de ritual e cartas da história, como 364 e 701–722) ficam **sem** o campo `password`.
- `level`: 1 a 12. `guardianStars`: duas entre Mars, Jupiter, Saturn, Uranus, Pluto, Neptune, Mercury, Sun, Moon, Venus.
- `monsterType` precisa ser o tipo do arquivo.

> Os valores do exemplo são ilustrativos: confira cada carta na fonte antes de enviar.

### Mágica, armadilha, equip ou ritual (`data/cards/magic.json`, `trap.json`, `equip.json`, `ritual.json`)

```json
{
  "id": 332,
  "name": "Mountain",
  "description": "Changes the field in favor of Dragon, Winged Beast, and Thunder monsters!",
  "cardType": "Magic",
  "password": { "code": "50913601", "cost": 55 }
}
```

`cardType` é `"Magic"`, `"Trap"`, `"Equip"` ou `"Ritual"`, de acordo com o arquivo.

### Receita de ritual (`data/rituals.json`)

```json
{ "ritual": 674, "result": 365, "materials": [186, 261, 595] }
```

Toda carta de ritual deve ter uma receita: a carta de ritual, o monstro invocado e os monstros sacrificados.

### Fusão (`data/fusions/<tipo>.json`)

```json
{
  "$schema": "../../schema/fusions.schema.json",
  "fusions": [{ "materials": [12, 345], "result": 400 }]
}
```

O jogo guarda fusões como **pares de cartas específicas**. Escreva o par com o **menor id primeiro**, uma vez só (a ordem não importa no jogo). O arquivo é o do tipo do monstro resultante.

### Equip e campo (`data/equips.json`, `data/fields.json`)

```json
{ "equip": 315, "targets": [1, 2, 3], "boost": 500 }
{ "field": 332, "boosts": ["Dragon", "Winged Beast", "Thunder"], "weakens": [], "amount": 500 }
```

### Duelista (`data/duelists/<id>.json`)

Um arquivo por duelista, com o nome do arquivo igual ao `id`:

```json
{
  "$schema": "../../schema/duelist.schema.json",
  "id": "simon-muran",
  "number": 1,
  "name": "Simon Muran",
  "portrait": { "source": "yugipedia", "url": "https://ms.yugipedia.com/d/d4/FMR_Simon.png", "width": 176, "height": 156 },
  "deck": [{ "card": 9, "weight": 72 }],
  "drops": { "S/A-POW": [{ "card": 9, "weight": 90 }], "B/C/D": [], "S/A-TEC": [] }
}
```

`number` é a ordem do jogo (Free Duel, 1 a 39). Os pesos são os do jogo, **de 2048**: a soma de cada lista (`deck` e cada rank de `drops`) tem que dar exatamente 2048 (`poolWeightTotal` em `rules.json`), e uma carta aparece no máximo uma vez por lista. Os dados vêm das tabelas do jogo, extraídas do disco pela [decompilação](https://github.com/Unchiga/Yu-Gi-Oh-Forbidden-Memories-Recompiled) (`notes/research/fusion-and-drop-tables/drops.csv`). O `portrait` é um link do Yugipedia (`Portal:Yu-Gi-Oh! Forbidden Memories characters`), conferido como as imagens das cartas.

## Validar

Na raiz do repositório (Node 22, `nvm use`):

```bash
yarn install
yarn validate        # erros apontam o arquivo e o registro, ex.: cards/magic.json: cards[0].password.code: must be 8 digits
yarn coverage:data   # quantas cartas já foram cadastradas (ex.: 5 / 722)
yarn test            # testes do catálogo
yarn dev             # site em http://localhost:3000, atualiza ao salvar um JSON
```

O que o `validate` verifica:

- **Erros** (bloqueiam o build e o CI): campo inválido ou desconhecido, `id` repetido ou fora de 1..722, senha sem 8 dígitos, monstro no arquivo de outro tipo, carta no arquivo de outro `cardType`, `$schema` errado, relação apontando para o tipo errado de carta, receita/equip/campo repetido, fusão com par fora de ordem ou repetido.
- **Avisos** (não bloqueiam): relação apontando para uma carta que ainda não foi cadastrada, carta de ritual sem receita, nomes repetidos. Enquanto o catálogo estiver incompleto, isso é esperado.

O CI roda as mesmas verificações em todo PR.

## Importar da Yu-Gi-Oh! Wiki

`yarn data:sync --dry-run` compara os dados com a [Yu-Gi-Oh! Wiki](https://yugioh.fandom.com/) e lista as cartas que faltam, as diferenças e o que não pôde ser importado. Sem `--dry-run`, grava as cartas e receitas que faltam (as já cadastradas são mantidas; `--overwrite` as substitui). Veja o [README](./README.md#sincronizar-com-a-yu-gi-oh-wiki). Num PR feito assim, a fonte é a wiki: cite-a.

## Abrir o PR

1. Cite a **fonte** de cada dado no PR (ex.: a página da carta, um guia, o próprio jogo).
2. Mude só arquivos de `catalog/data/` em um PR de dados.
3. Use o modelo de PR de dados: acrescente `?template=data.md` ao link de criação do PR, ou copie `.github/PULL_REQUEST_TEMPLATE/data.md`.

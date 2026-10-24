# Dados do catálogo

Como os dados do `@mhsalves/yugioh-fm-catalog` ficam organizados no repositório, como contribuir e como sincronizar com a Yu-Gi-Oh! Wiki. Para usar a biblioteca, veja o [README](../README.md).

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
│   ├── images.json               # Links das imagens das cartas (spec 08)
│   └── rules.json                # Total de cartas, vantagem e bônus das guardian stars
├── docs/                         # Esta documentação
├── schema/                       # Esquemas Zod e os JSON Schemas gerados ($schema dos arquivos)
├── scripts/                      # validate, data:build, schema:build, coverage:data
└── src/                          # API de consulta e tipos públicos
```

`id` é o número da carta no jogo (1 a 722). Referências entre cartas usam esse número. Os campos de cada carta seguem os tipos descritos no [README](../README.md#types).

## Contribuindo com Dados

Adicionar uma carta é editar **um arquivo JSON** em `catalog/data/`, sem mexer em código. O guia completo, com modelos para copiar, está em [CONTRIBUTING-DATA.md](../CONTRIBUTING-DATA.md).

```bash
yarn validate        # na raiz: verifica todos os arquivos de dados
yarn coverage:data   # quantas cartas já foram cadastradas
```

## Sincronizar com a Yu-Gi-Oh! Wiki

`yarn data:sync` preenche `catalog/data/` com as cartas e as receitas de ritual da [Yu-Gi-Oh! Wiki](https://yugioh.fandom.com/wiki/List_of_Yu-Gi-Oh!_Forbidden_Memories_cards), pela API do site (spec 03 A-5).

```bash
yarn data:sync --dry-run    # mostra o que mudaria, sem gravar
yarn data:sync              # grava; dados já cadastrados são mantidos e as diferenças listadas
yarn data:sync --overwrite  # substitui os dados cadastrados pelos da wiki
```

Uma carta sem senha nem custo na wiki entra sem `password` (o jogo não dá senha aos monstros de ritual e às cartas da história). O que a wiki informa de forma incompleta não é inventado: a carta é pulada e aparece na lista do relatório. Cuidado com `--overwrite`: 15 cartas foram corrigidas a partir dos dados do jogo, onde a wiki está errada (veja o [CHANGELOG](../CHANGELOG.md) 0.4.0), e ele trocaria essas correções pelos valores da wiki. Nada é gravado se os dados resultantes não passarem no `validate`.

## Imagens das cartas

O pacote traz **só links**, nenhuma imagem (spec 08). `data/images.json` tem uma imagem para cada uma das 722 cartas, e o `yarn data:sync` preenche o arquivo:

- 618 da [Yu-Gi-Oh! Wiki](https://yugioh.fandom.com/) (Fandom), a carta escaneada do jogo (cerca de 300 × 423), pela propriedade `Card image` e a API `imageinfo`;
- 104 do [Yugipedia](https://yugipedia.com/), para as cartas que a Fandom só mostra com o verso (`Back-FMR-EN-VG.png`): é a captura da tela da carta no jogo (`<Nome>-FMR-NA-VG.png`, 320 × 240), e `crop` diz qual retângulo dela é a carta.

Uma nova revisão do mesmo arquivo (novo `?cb=`) substitui a entrada; um arquivo diferente colado à mão é mantido, a menos que se use `--overwrite`. O `validate` confere o host, se a pasta `<h>/<hh>` da URL bate com o md5 do nome do arquivo e se o `crop` cabe na imagem.

As imagens são capturas de um jogo de PS1, com pouco contraste: o site as realça só no navegador, com `--card-image-filter` em `mkt_site/src/styles.css`.

## Licença dos dados

A licença dos dados importados da wiki ainda está em aberto (spec 03, TBD-A4).

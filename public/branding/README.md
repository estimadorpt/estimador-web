# Kit de redes e de marca

Tudo aqui é gerado por `npm run brand` a partir de `src/lib/brand/geometry.json` e do mesmo renderizador dos cartões Open Graph (`scripts/generate-social-kit.mjs`), para que a linha do tempo mostre uma só publicação. O guia da identidade, com as regras e os ficheiros do símbolo, está em `/marca`.

## Perfis

| Ficheiro | Tamanho | Onde |
| --- | --- | --- |
| `avatar-1024-forest.png`, `../images/brand/profile-400.png` | 1024 e 400 | Avatar em todas as redes: símbolo em papel sobre floresta |
| `avatar-1024-paper.png` | 1024 | Avatar claro, para fundos escuros da própria rede |
| `../images/brand/banner-1500x500.png` | 1500 × 500 | Cabeçalho do X e do Bluesky, claro |
| `banner-1500x500-dark.png` | 1500 × 500 | O mesmo, sobre floresta |
| `linkedin-cover-light.png`, `linkedin-cover-dark.png` | 1584 × 396 | Capa do LinkedIn; o canto inferior esquerdo fica livre para a fotografia |

## Publicações

| Ficheiro | Tamanho | Onde |
| --- | --- | --- |
| `linkedin-post-light.png`, `linkedin-post-dark.png` | 1200 × 1200 | Modelo quadrado para anúncios |
| `post-1600x900-light.png` | 1600 × 900 | Modelo 16:9 |
| `story-1080x1920-light.png`, `story-1080x1920-dark.png` | 1080 × 1920 | Stories |
| `../data/football/liga-*/social/mdNN.png` | 1200 × 675 | Cartão de jornada, por `node scripts/generate-social-images.mjs` |

## Logótipos (compatibilidade)

`logo-horizontal`, `logo-icon-large` e `logo-stacked` mantêm os nomes históricos. Os ficheiros `logo-stacked` contêm a assinatura horizontal centrada num quadrado, não um logótipo empilhado: a marca não se recompõe. Os ficheiros de referência estão em `../brand/`.

## Voz

Frase: **Dados para compreender Portugal.** Descrição: *Previsões e análises com a incerteza à vista: economia, Liga Portugal, eleições e população.* Escreve-se em frases, em caixa baixa; perguntas como títulos; a incerteza diz-se, não se esconde; cada publicação com data e fonte; uma ação por peça.

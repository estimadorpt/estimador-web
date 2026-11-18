# Kit de redes e de marca

Os ficheiros estão em `public/branding/`, salvo indicação em contrário (este texto vivia nessa pasta e saiu dela para não ser publicado com o site).

Tudo aqui é gerado por `npm run brand` a partir de `src/lib/brand/geometry.json` e do mesmo renderizador dos cartões Open Graph (`scripts/generate-social-kit.mjs`), para que a linha do tempo mostre uma só publicação. O guia da identidade, com as regras e os ficheiros do símbolo, está em `/marca`.

## Perfis

| Ficheiro | Tamanho | Onde |
| --- | --- | --- |
| `avatar-1024-forest.png`, `public/images/brand/profile-400.png` | 1024 e 400 | Avatar em todas as redes: símbolo em papel sobre floresta |
| `avatar-1024-paper.png` | 1024 | Avatar claro, para fundos escuros da própria rede |
| `public/images/brand/banner-1500x500.png` | 1500 × 500 | Cabeçalho do X e do Bluesky, claro |
| `banner-1500x500-dark.png` | 1500 × 500 | O mesmo, sobre floresta |
| `linkedin-cover-light.png`, `linkedin-cover-dark.png` | 1584 × 396 | Capa do LinkedIn; o canto inferior esquerdo fica livre para a fotografia |

## Publicações

| Ficheiro | Tamanho | Onde |
| --- | --- | --- |
| `linkedin-post-light.png`, `linkedin-post-dark.png` | 1200 × 1200 | Modelo quadrado para anúncios |
| `post-1600x900-light.png` | 1600 × 900 | Modelo 16:9 |
| `story-1080x1920-light.png`, `story-1080x1920-dark.png` | 1080 × 1920 | Stories |
| `public/data/football/liga-*/social/mdNN.png` | 1200 × 675 | Cartão de jornada, por `node scripts/generate-social-images.mjs` |

## Logótipos (compatibilidade)

`logo-horizontal`, `logo-icon-large` e `logo-stacked` mantêm os nomes históricos. Os ficheiros `logo-stacked` contêm a assinatura horizontal centrada num quadrado, não um logótipo empilhado: a marca não se recompõe. Os ficheiros de referência estão em `public/brand/`.

## Voz

Frase: **Dados para compreender Portugal.** Descrição: *Dados e modelos sobre Portugal, com a incerteza à vista: quem vive em cada freguesia, como pode acabar a Liga e o que diziam as previsões eleitorais.* (Ambas vivem em `src/lib/brand/descriptor.json`.) Escreve-se em frases, em caixa baixa; o resultado como título, nunca uma pergunta; a incerteza desenha-se e data-se, não se declara; trata-se o leitor por tu; sem emoji nem pontos de exclamação; cada publicação com data e fonte; uma ação por peça.

## Publicação automática

Depois de cada deploy de `main`, `.github/workflows/social.yml` corre `node scripts/social-post.mjs --draft`: se a previsão da Liga mais recente tem menos de sete dias e ainda não tem issue, abre uma issue com a etiqueta `social` com o texto para o Bluesky, para o X e para o LinkedIn, e o cartão nos artefactos da execução. Quando `bernardocaldas` (ou quem a variável `SOCIAL_APPROVER` indicar) lhe junta a etiqueta `approved`, o mesmo script publica no Bluesky e no X, comenta os links e fecha a issue. Se uma rede falhar, a issue fica aberta; tirar e voltar a pôr `approved` tenta outra vez, saltando as redes já publicadas. Com a variável de repositório `SOCIAL_MODE=auto`, publica logo, e a issue fica como registo. O LinkedIn copia-se à mão a partir da issue.

O texto vem de `scripts/lib/social-posts.mjs`: modelos fixos preenchidos com os números que a página imprime (a frase do título, as percentagens e a hora de Lisboa), nunca um modelo de linguagem. `src/lib/social-posts-script.test.ts` confere os números, a voz e o comprimento de cada rede em todas as previsões da época. Para ver o que sairia: `node scripts/social-post.mjs --dry-run [--matchday 11] [--out pasta]`.

Segredos (GitHub, estimador-web): `BLUESKY_HANDLE`, `BLUESKY_APP_PASSWORD`, `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`. Uma rede sem os seus segredos é saltada, com uma nota na issue.

## Perfis: texto

Nome: **estimador.pt**. Bio (X, Bluesky): a `bio.pt` de `descriptor.json`. Sobre (LinkedIn): o `descriptor`, em português e em inglês. Link: https://estimador.pt/pt/. O nome do dono não entra na bio.

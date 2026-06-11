#!/usr/bin/env python3
"""Generate social media posts from Liga Portugal matchday prediction data.

Reads current and previous matchday JSONs, extracts narrative data points,
and uses Azure OpenAI to generate platform-specific posts (X, LinkedIn, Bluesky).

Usage:
    python scripts/generate-social-content.py              # auto-detect latest matchday
    python scripts/generate-social-content.py --matchday 25 # specify matchday
    python scripts/generate-social-content.py --dry-run     # print to stdout, don't save
"""

import argparse
import glob
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

BRAND_VOICE = """\
Tu és o editor de redes sociais do estimador.pt, uma plataforma de análise de dados \
sobre futebol e política em Portugal.

Voz da marca:
- Português europeu, registo informal — mas NUNCA escrevas "você"/"vocês" explicitamente. \
Usa conjugação informal natural (ex: "sabem aquela sensação..." e não "vocês sabem...").
- Playful mas não parvo, confiante mas não arrogante.
- Parágrafos curtos, abertura com gancho. Termina com o dado ou a ideia — sem perguntas retóricas no final.
- Sem emojis. Sem jargão técnico. Sem linguagem corporativa.
- Liga os dados a coisas que as pessoas sentem e vivem.
- Referência de tom: "O nosso trabalho é juntar todas essas histórias e perceber o que nos dizem."
- Usa "pp" (pontos percentuais) para variações de probabilidade, nunca "%".
- Menciona sempre o estimador.pt subtilmente (não como CTA agressivo).
- TODOS os caracteres portugueses devem ter acentuação correcta (á, é, í, ó, ú, ã, õ, ç, â, ê, ô).
- Ortografia portuguesa europeia rigorosa. Atenção a erros comuns: "vêem" (não "vêm"), \
"lêem" (não "lêm"), "crêem" (não "crêm"). Usa o Acordo Ortográfico de 1990.

PROIBIDO — evita sempre:
- Clichés de comentário desportivo: "ainda há jogo", "os números falam", "a bola é redonda", \
"falam claro", "resta saber", "o tempo dirá", "tudo em aberto", "contas feitas".
- Frases genéricas que não dizem nada: "é preciso estar atento", "vai ser interessante".
- Engagement farming: perguntas retóricas no final ("o que acham?", "como vêem isto?", \
"concordam?", "qual é a vossa opinião?"). O post acaba com a ideia, não com um convite forçado.
- Tom de relator ou cronista desportivo. Escreve como quem conversa num café, não como quem \
narra um jogo.

Bons exemplos de tom:
- "Há um jogo na J29 que pode mudar tudo: Estoril–Porto, 35pp de oscilação no título."
- "Uma jornada de empates e o título mexeu 7pp. Às vezes é nos jogos cinzentos que se decide o campeonato."

IMPORTANTE — neutralidade:
- Nunca tomes partido por nenhuma equipa. Sem provocações, sem "agradece", sem gozo.
- Apresenta os dados de forma neutra e curiosa. Deixa os adeptos tirar as suas conclusões.

Restrições por plataforma:
- X (Twitter): máximo 280 caracteres. Uma ideia forte, sem floreados.
- LinkedIn: 1 a 3 parágrafos curtos. Mais contexto, tom ligeiramente mais sério mas acessível.
- Bluesky: máximo 300 caracteres. Similar ao X mas pode ter ligeiramente mais espaço.

Formato de output — responde APENAS com JSON válido, sem markdown:
{
  "x": "texto do post para X",
  "linkedin": "texto do post para LinkedIn",
  "bluesky": "texto do post para Bluesky"
}
"""

DATA_DIR = Path(__file__).resolve().parent.parent / "public" / "data" / "football" / "liga-2025-26"


def find_matchday_files(data_dir: Path) -> list[int]:
    """Find all available matchday numbers, sorted ascending."""
    files = glob.glob(str(data_dir / "md*.json"))
    matchdays = set()
    for f in files:
        m = re.search(r"md(\d+)\.json$", f)
        if m:
            matchdays.add(int(m.group(1)))
    return sorted(matchdays)


def load_json(path: Path) -> dict:
    with open(path) as f:
        return json.load(f)


def extract_data_context(current: dict, previous: dict | None, scenarios: dict | None) -> dict:
    """Extract narrative-ready data points from matchday JSONs."""
    ctx: dict = {
        "matchday": current["matchday"],
        "season": current["season"],
    }

    # Current standings
    table = {t["team"]: t for t in current["table"]}
    standings = sorted(current["actual_standings"], key=lambda t: (-t["points"], -t["gd"]))
    leader = standings[0]
    second = standings[1]
    ctx["leader"] = leader["team"]
    ctx["leader_points"] = leader["points"]
    ctx["second"] = second["team"]
    ctx["second_points"] = second["points"]
    ctx["points_gap"] = leader["points"] - second["points"]

    # Matchday results
    ctx["matchday_results"] = [
        f"{r['home']} {r['home_goals']}-{r['away_goals']} {r['away']}"
        for r in current.get("matchday_results", [])
    ]

    # Championship probabilities
    champ_probs = sorted(
        [(t["team"], t["p_champion"]) for t in current["table"] if t["p_champion"] > 0.001],
        key=lambda x: -x[1],
    )
    ctx["championship_probs"] = [
        {"team": team, "p_champion": round(p * 100, 1)} for team, p in champ_probs
    ]

    # Deltas (if previous matchday available)
    if previous:
        prev_table = {t["team"]: t for t in previous["table"]}

        # Championship movers
        champ_deltas = []
        for team, data in table.items():
            prev = prev_table.get(team)
            if prev:
                delta = data["p_champion"] - prev["p_champion"]
                if abs(delta) > 0.005:
                    champ_deltas.append({
                        "team": team,
                        "delta_pp": round(delta * 100, 1),
                        "current": round(data["p_champion"] * 100, 1),
                    })
        champ_deltas.sort(key=lambda x: -abs(x["delta_pp"]))
        ctx["championship_movers"] = champ_deltas[:5]

        # Relegation movers
        releg_deltas = []
        for team, data in table.items():
            prev = prev_table.get(team)
            if prev:
                delta = data["p_relegation"] - prev["p_relegation"]
                if abs(delta) > 0.005:
                    releg_deltas.append({
                        "team": team,
                        "delta_pp": round(delta * 100, 1),
                        "current": round(data["p_relegation"] * 100, 1),
                    })
        releg_deltas.sort(key=lambda x: -abs(x["delta_pp"]))
        ctx["relegation_movers"] = releg_deltas[:5]

    # Scenarios — decisive matches
    if scenarios and "decisive_matches" in scenarios:
        top_decisive = scenarios["decisive_matches"][:3]
        ctx["decisive_matches"] = [
            {
                "home": m["home_team"],
                "away": m["away_team"],
                "matchday": m["matchday"],
                "most_affected": m["most_affected_team"],
                "title_swing_pp": round(m["title_swing"] * 100, 1),
                "p_champ_if_win": round(m["p_champ_if_A" if m["most_affected_team"] == m["away_team"] else "p_champ_if_H"] * 100, 1),
                "p_champ_if_lose": round(m["p_champ_if_H" if m["most_affected_team"] == m["away_team"] else "p_champ_if_A"] * 100, 1),
            }
            for m in top_decisive
        ]

    return ctx


def build_user_prompt(ctx: dict) -> str:
    """Build the user prompt with structured data context."""
    lines = [
        f"Jornada {ctx['matchday']} da Liga Portugal {ctx['season']}",
        "",
        f"Classificação: {ctx['leader']} lidera com {ctx['leader_points']} pontos, "
        f"+{ctx['points_gap']} sobre o {ctx['second']} ({ctx['second_points']} pts).",
        "",
    ]

    if ctx.get("matchday_results"):
        lines.append("Resultados da jornada:")
        for r in ctx["matchday_results"]:
            lines.append(f"  {r}")
        lines.append("")

    if ctx.get("championship_probs"):
        lines.append("Probabilidades de título:")
        for p in ctx["championship_probs"]:
            lines.append(f"  {p['team']}: {p['p_champion']}%")
        lines.append("")

    if ctx.get("championship_movers"):
        lines.append("Maiores variações no título (vs jornada anterior):")
        for m in ctx["championship_movers"]:
            sign = "+" if m["delta_pp"] > 0 else ""
            lines.append(f"  {m['team']}: {sign}{m['delta_pp']}pp (agora {m['current']}%)")
        lines.append("")

    if ctx.get("relegation_movers"):
        lines.append("Maiores variações na descida (vs jornada anterior):")
        for m in ctx["relegation_movers"]:
            sign = "+" if m["delta_pp"] > 0 else ""
            lines.append(f"  {m['team']}: {sign}{m['delta_pp']}pp (agora {m['current']}%)")
        lines.append("")

    if ctx.get("decisive_matches"):
        lines.append("Jogos mais decisivos para o título (próximas jornadas):")
        for d in ctx["decisive_matches"]:
            lines.append(
                f"  {d['home']} vs {d['away']} (J{d['matchday']}): "
                f"oscilação de {d['title_swing_pp']}pp para {d['most_affected']} "
                f"(se ganha: {d['p_champ_if_win']}%, se perde: {d['p_champ_if_lose']}%)"
            )
        lines.append("")

    lines.append(
        "Gera 3 posts (X, LinkedIn, Bluesky) com base nestes dados. "
        "Escolhe o ângulo narrativo mais interessante — não precisas de mencionar tudo. "
        "Inclui sempre pelo menos um dado concreto (probabilidade, variação, resultado)."
    )
    return "\n".join(lines)


def generate_posts(ctx: dict, dry_run: bool = False) -> dict:
    """Call Azure OpenAI to generate social media posts."""
    try:
        from openai import AzureOpenAI
    except ImportError:
        print("Error: openai package not installed. Run: pip install openai", file=sys.stderr)
        sys.exit(1)

    required_vars = [
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_VERSION",
        "AZURE_OPENAI_MODEL_NAME",
    ]
    missing = [v for v in required_vars if not os.environ.get(v)]
    if missing:
        print(f"Error: missing environment variables: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)

    client = AzureOpenAI(
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    )

    user_prompt = build_user_prompt(ctx)

    if dry_run:
        print("=== SYSTEM PROMPT ===")
        print(BRAND_VOICE)
        print("\n=== USER PROMPT ===")
        print(user_prompt)
        print("====================\n")

    response = client.chat.completions.create(
        model=os.environ["AZURE_OPENAI_MODEL_NAME"],
        messages=[
            {"role": "system", "content": BRAND_VOICE},
            {"role": "user", "content": user_prompt},
        ],
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    return json.loads(content)


def main():
    parser = argparse.ArgumentParser(description="Generate social media content for Liga Portugal matchday")
    parser.add_argument("--matchday", type=int, help="Matchday number (auto-detects latest if omitted)")
    parser.add_argument("--dry-run", action="store_true", help="Print to stdout, don't save file")
    args = parser.parse_args()

    available = find_matchday_files(DATA_DIR)
    if not available:
        print("Error: no matchday files found", file=sys.stderr)
        sys.exit(1)

    if args.matchday:
        if args.matchday not in available:
            print(f"Error: md{args.matchday}.json not found. Available: {available}", file=sys.stderr)
            sys.exit(1)
        current_md = args.matchday
    else:
        current_md = available[-1]

    # Find previous matchday
    idx = available.index(current_md)
    previous_md = available[idx - 1] if idx > 0 else None

    print(f"Matchday: {current_md} (previous: {previous_md or 'none'})")

    # Load data
    current = load_json(DATA_DIR / f"md{current_md}.json")

    previous = None
    if previous_md:
        previous = load_json(DATA_DIR / f"md{previous_md}.json")

    scenarios = None
    scenarios_path = DATA_DIR / f"md{current_md}_scenarios.json"
    if scenarios_path.exists():
        scenarios = load_json(scenarios_path)

    # Extract data context
    ctx = extract_data_context(current, previous, scenarios)

    # Generate posts
    posts = generate_posts(ctx, dry_run=args.dry_run)

    # Validate character limits
    limits = {"x": 280, "linkedin": 3000, "bluesky": 300}
    for platform, limit in limits.items():
        text = posts.get(platform, "")
        chars = len(text)
        if chars > limit:
            print(f"Warning: {platform} post is {chars} chars (limit: {limit})", file=sys.stderr)

    # Build output
    output = {
        "matchday": current_md,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "posts": {
            platform: {"text": posts.get(platform, ""), "chars": len(posts.get(platform, ""))}
            for platform in ["x", "linkedin", "bluesky"]
        },
        "image": f"social/md{current_md}.png",
        "data_context": {
            "championship_probs": ctx.get("championship_probs", []),
            "championship_movers": ctx.get("championship_movers", []),
            "relegation_movers": ctx.get("relegation_movers", []),
            "decisive_matches": ctx.get("decisive_matches", []),
        },
    }

    if args.dry_run:
        print("\n=== GENERATED POSTS ===")
        for platform in ["x", "linkedin", "bluesky"]:
            text = posts.get(platform, "")
            print(f"\n--- {platform.upper()} ({len(text)} chars) ---")
            print(text)
        print("\n=== FULL OUTPUT JSON ===")
        print(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        out_dir = DATA_DIR / "social"
        out_dir.mkdir(exist_ok=True)
        out_path = out_dir / f"md{current_md}.json"
        with open(out_path, "w") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        print(f"Saved to {out_path}")


if __name__ == "__main__":
    main()

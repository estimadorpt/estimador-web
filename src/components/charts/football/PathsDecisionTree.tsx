"use client";

import React from "react";

// ── Mock Data ──────────────────────────────────────────────────────────────

interface TreeNode {
  matchday: string;
  opponent: string;
  venue: "H" | "A";
  pWin: number;
  titleIfWin: number;
  titleIfLose: number;
  children?: {
    win?: TreeNode;
    lose?: TreeNode;
  };
}

const portoTree: TreeNode = {
  matchday: "J24",
  opponent: "Estoril",
  venue: "H",
  pWin: 0.78,
  titleIfWin: 0.7,
  titleIfLose: 0.52,
  children: {
    win: {
      matchday: "J28",
      opponent: "Sporting CP",
      venue: "H",
      pWin: 0.52,
      titleIfWin: 0.88,
      titleIfLose: 0.45,
      children: {
        win: {
          matchday: "J30",
          opponent: "Benfica",
          venue: "A",
          pWin: 0.45,
          titleIfWin: 0.95,
          titleIfLose: 0.78,
        },
        lose: {
          matchday: "J30",
          opponent: "Benfica",
          venue: "A",
          pWin: 0.45,
          titleIfWin: 0.58,
          titleIfLose: 0.32,
        },
      },
    },
    lose: {
      matchday: "J28",
      opponent: "Sporting CP",
      venue: "H",
      pWin: 0.52,
      titleIfWin: 0.62,
      titleIfLose: 0.28,
    },
  },
};

const sportingTree: TreeNode = {
  matchday: "J24",
  opponent: "Moreirense",
  venue: "A",
  pWin: 0.62,
  titleIfWin: 0.37,
  titleIfLose: 0.22,
  children: {
    win: {
      matchday: "J28",
      opponent: "Porto",
      venue: "A",
      pWin: 0.38,
      titleIfWin: 0.55,
      titleIfLose: 0.18,
      children: {
        win: {
          matchday: "J30",
          opponent: "SC Braga",
          venue: "H",
          pWin: 0.68,
          titleIfWin: 0.65,
          titleIfLose: 0.38,
        },
      },
    },
    lose: {
      matchday: "J28",
      opponent: "Porto",
      venue: "A",
      pWin: 0.38,
      titleIfWin: 0.42,
      titleIfLose: 0.08,
    },
  },
};

// ── Component ──────────────────────────────────────────────────────────────

const TEAM_COLORS: Record<string, string> = {
  Porto: "#003893",
  "Sporting CP": "#006B3F",
};

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

function TreeNodeCard({
  node,
  depth = 0,
  teamColor,
}: {
  node: TreeNode;
  depth?: number;
  teamColor: string;
  }) {
  const hasChildren = node.children && (node.children.win || node.children.lose);

  return (
    <div className={depth > 0 ? "mt-3" : ""}>
      {/* Node card */}
      <div className="border border-stone-200 bg-white p-3 md:p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            {node.matchday}
          </span>
          <span className="text-sm font-medium text-stone-700">
            vs {node.opponent}
          </span>
          <span className="text-xs text-stone-400">
            ({node.venue === "H" ? "Casa" : "Fora"})
          </span>
        </div>

        {/* Win probability bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-stone-500 mb-1">
            <span>Prob. vitória</span>
            <span className="tabular-nums font-medium">{pct(node.pWin)}</span>
          </div>
          <div className="h-2 bg-stone-100 w-full">
            <div
              className="h-full"
              style={{
                width: pct(node.pWin),
                backgroundColor: teamColor,
                opacity: 0.7,
              }}
            />
          </div>
        </div>

        {/* Branch outcomes */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-green-600 rounded-full shrink-0" />
            <div>
              <div className="text-xs text-stone-400">Se vence</div>
              <div className="text-sm font-bold tabular-nums text-green-700">
                {pct(node.titleIfWin)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0" />
            <div>
              <div className="text-xs text-stone-400">Se perde</div>
              <div className="text-sm font-bold tabular-nums text-red-600">
                {pct(node.titleIfLose)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children branches */}
      {hasChildren && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-4 mt-0">
          {node.children?.win && (
            <div className="relative pl-4 md:pl-6 pt-2">
              {/* Vertical connector line */}
              <div
                className="absolute left-0 md:left-2 top-0 bottom-1/2 w-px"
                style={{ backgroundColor: "rgb(22 163 74)" }}
              />
              <div
                className="absolute left-0 md:left-2 top-1/2 w-3 md:w-4 h-px"
                style={{ backgroundColor: "rgb(22 163 74)" }}
              />
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-green-700">
                  Vitória
                </span>
                <span className="text-xs text-stone-400">→ título a {pct(node.titleIfWin)}</span>
              </div>
              <TreeNodeCard
                node={node.children.win}
                depth={depth + 1}
                teamColor={teamColor}
              />
            </div>
          )}
          {node.children?.lose && (
            <div className="relative pl-4 md:pl-6 pt-2">
              <div
                className="absolute left-0 md:left-2 top-0 bottom-1/2 w-px"
                style={{ backgroundColor: "rgb(220 38 38)" }}
              />
              <div
                className="absolute left-0 md:left-2 top-1/2 w-3 md:w-4 h-px"
                style={{ backgroundColor: "rgb(220 38 38)" }}
              />
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                  Derrota
                </span>
                <span className="text-xs text-stone-400">→ título a {pct(node.titleIfLose)}</span>
              </div>
              <TreeNodeCard
                node={node.children.lose}
                depth={depth + 1}
                teamColor={teamColor}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TeamTree({
  teamName,
  currentProb,
  tree,
}: {
  teamName: string;
  currentProb: number;
  tree: TreeNode;
}) {
  const teamColor = TEAM_COLORS[teamName] || "#78716c";

  return (
    <div className="space-y-4">
      {/* Team header */}
      <div className="flex items-center gap-3">
        <div
          className="w-1.5 h-8 shrink-0"
          style={{ backgroundColor: teamColor }}
        />
        <div>
          <div className="text-lg font-bold tracking-tight text-stone-900">
            {teamName}
          </div>
          <div className="text-sm text-stone-500">
            Probabilidade atual:{" "}
            <span className="font-bold tabular-nums" style={{ color: teamColor }}>
              {pct(currentProb)}
            </span>
          </div>
        </div>
      </div>

      {/* Tree */}
      <TreeNodeCard node={tree} teamColor={teamColor} />
    </div>
  );
}

export default function PathsDecisionTree() {
  return (
    <div className="space-y-8">
      {/* Section header */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
          Abordagem A
        </div>
        <h3 className="text-xl font-bold tracking-tight text-stone-900 mb-1">
          Árvore de Decisão
        </h3>
        <p className="text-sm text-stone-500">
          Momentos de viragem que separam os cenários. Cada jogo ramifica a probabilidade
          de título em dois caminhos — vitória ou derrota.
        </p>
      </div>

      {/* Teams */}
      <div className="grid grid-cols-1 gap-10">
        <TeamTree teamName="Porto" currentProb={0.66} tree={portoTree} />
        <div className="border-t border-stone-200" />
        <TeamTree teamName="Sporting CP" currentProb={0.33} tree={sportingTree} />
      </div>
    </div>
  );
}

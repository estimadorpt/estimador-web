import { describe, expect, it } from 'vitest';
import {
  loadContestedRatings,
  loadContribRatings,
  loadDefRatings,
  loadGkChannels,
  loadGkRatings,
  loadLigaPlayers,
  loadLigaPlayersDetail,
} from '@/lib/utils/football-data-loader';
import { playerCutoffMeta, playerInventory, playerInventorySentence } from './player-inventory';
import { CURRENT_LIGA_SEASON } from '@/lib/config/football';

async function feeds() {
  const [finishers, contrib, gk, def, contested, gkChannels] = await Promise.all([
    loadLigaPlayers(),
    loadContribRatings(),
    loadGkRatings(),
    loadDefRatings(),
    loadContestedRatings(),
    loadGkChannels(),
  ]);
  return { finishers: (finishers?.players?.length ?? 0) > 0, contrib, gk, def, contested, gkChannels };
}

describe('the /jogadores inventory (audit CL3-12, UXD2-29)', () => {
  it('says what is ranked first and what is not, conclusion last, with no "defesa de remates, defesas" repeat', async () => {
    const f = await feeds();
    const pt = playerInventorySentence(playerInventory(f, 'pt'), 'pt');
    expect(pt).toBe(
      'Com lista ordenada: finalização, contribuição ofensiva, posse disputada e intervenção em cruzamentos. ' +
        'Sem lista ordenada, porque o modelo ainda não separa os jogadores: guarda-redes (defesa de remates, 4 épocas) e defesas.',
    );
    const en = playerInventorySentence(playerInventory(f, 'en'), 'en');
    expect(en).toBe(
      'Ranked lists: finishing, attacking contribution, contested possession and cross intervention. ' +
        'No ranked list yet, because the model cannot tell the players apart: goalkeepers (shot-stopping, 4 seasons) and defenders.',
    );
  });

  it('keeps the three states apart: ranked, unranked and missing', () => {
    const inv = playerInventory({ finishers: false, contrib: null, gk: null, def: null }, 'pt');
    expect(inv.ranked).toEqual([]);
    expect(inv.missing).toEqual(['finalização', 'contribuição ofensiva', 'guarda-redes (xGOT)', 'defesas']);
    expect(playerInventorySentence(inv, 'pt')).toMatch(/^Ainda não há nenhuma lista ordenada\. Ainda sem métrica: /);
  });

  it('states the data cut-off once, for the two fits it applies to', async () => {
    const [players, detail] = await Promise.all([loadLigaPlayers(), loadLigaPlayersDetail()]);
    const meta = playerCutoffMeta(detail?.appearances_through, players?.generated_from?.seasons, 'pt');
    // Read from the files: a fit that includes the season being played says
    // so, and never promises the next season's games.
    if (players?.generated_from?.seasons?.at(-1) === CURRENT_LIGA_SEASON) {
      expect(meta).toMatch(/^Dados até \d+ \S+ \d{4} \(época \d{4}-\d{2} em curso\) em finalização e contribuição; /);
    } else {
      expect(meta).toMatch(/^Dados até \d+ \S+ \d{4} \(fim da época \d{4}-\d{2}\) em finalização e contribuição, ainda sem jogos de \d{4}-\d{2}; /);
    }
    expect(playerCutoffMeta('2026-05-16', ['2024-25', '2025-26'], 'pt')).toBe(
      'Dados até 16 mai. 2026 (fim da época 2025-26) em finalização e contribuição, ainda sem jogos de 2026-27; as outras métricas dizem as épocas que cobrem.',
    );
    expect(playerCutoffMeta('2026-10-10', ['2025-26', '2026-27'], 'pt')).toBe(
      'Dados até 10 out. 2026 (época 2026-27 em curso) em finalização e contribuição; as outras métricas dizem as épocas que cobrem.',
    );
    expect(playerCutoffMeta(null, ['2025-26'], 'pt')).toBeNull();
  });
});

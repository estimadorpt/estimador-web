Aguarda parecer, the Lisbon housing game.

sim/, data/, ui/ and habitacao.css are mirrored from bernardocaldas/habitacao (src/) at
c99927d. Edit them there, run its tests, then copy them here; HousingGame.tsx is the only
file that belongs to this repository.

The map geometry (`data/lisboa-freguesias.json`, `data/terra.json`, `data/vizinhos.json`) combines
CAOP 2021 boundaries (DGT, CC BY 4.0) with the OpenStreetMap shoreline (© OpenStreetMap
contributors), so those three files are offered under the Open Database License 1.0, not under
the site's CC BY-NC 4.0; the map credits both. Sources and processing: `docs/GEOMETRIA.md` in
bernardocaldas/habitacao.

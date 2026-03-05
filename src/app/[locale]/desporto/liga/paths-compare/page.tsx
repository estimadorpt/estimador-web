import PathsNarrativeRefined from "@/components/charts/football/PathsNarrativeRefined";
import PathsTable from "@/components/charts/football/PathsTable";
import PathsNarrative from "@/components/charts/football/PathsNarrative";
import PathsDecisionTree from "@/components/charts/football/PathsDecisionTree";
import PathsArchetypes from "@/components/charts/football/PathsArchetypes";
import PathsCascade from "@/components/charts/football/PathsCascade";
import PathsCascadeSimple from "@/components/charts/football/PathsCascadeSimple";
import PathsCascadeSlope from "@/components/charts/football/PathsCascadeSlope";
import PathsCascadeInline from "@/components/charts/football/PathsCascadeInline";

export default function PathsComparePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-stone-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
          <div className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
            Mockups — Caminhos para o Título
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            Comparação de Abordagens
          </h1>
          <p className="text-stone-400 text-sm max-w-2xl">
            D-ref — Narrativa refinada · E — Tabela · D — Narrativa original ·
            A/B/C/C1/C2/C3 — Anteriores
          </p>
        </div>
      </section>

      {/* D-Refined: Narrative with shared prefix + cuts */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PathsNarrativeRefined />
        </div>
      </section>

      {/* E: Table */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PathsTable />
        </div>
      </section>

      {/* D: Original Narrative */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PathsNarrative />
        </div>
      </section>

      {/* Older approaches below */}
      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PathsDecisionTree />
        </div>
      </section>

      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PathsArchetypes />
        </div>
      </section>

      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PathsCascade />
        </div>
      </section>

      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PathsCascadeSimple />
        </div>
      </section>

      <section className="border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PathsCascadeSlope />
        </div>
      </section>

      <section>
        <div className="max-w-7xl mx-auto px-4 py-10">
          <PathsCascadeInline />
        </div>
      </section>
    </div>
  );
}

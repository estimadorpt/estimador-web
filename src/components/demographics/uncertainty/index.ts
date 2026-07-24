// Barrel for the uncertainty UX presentational components. A2 (scorecard) and A3
// (tabulator) MAY import from here; the components are self-contained (they call
// @/lib/populacao/uncertainty directly and own no data-loading).
export { ConfidenceChip } from './ConfidenceChip';
export { UncertainNumber } from './UncertainNumber';
export { RankedList, type RankedListItem } from './RankedList';
export { UncertaintyExplainer } from './UncertaintyExplainer';

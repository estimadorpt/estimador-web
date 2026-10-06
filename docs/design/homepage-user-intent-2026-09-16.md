# Homepage user-intent reassessment

This is a product hypothesis based on the current product direction and implementation. It is not evidence of audience demand: no analytics, interviews or usability study inform these priorities.

| Section | Likely audience and primary job | Secondary job | Landing destination |
| --- | --- | --- | --- |
| Population | **Hypothesis:** researchers may ask whether the population can support a study or lesson; public and teaching visitors may ask what a fictional population demonstration can help them understand. Both are visible choices. | Move between availability/limits and a clearly fictional exploration without mistaking either for evidence about Portuguese places. | Research: `/populacao/dados`; demonstration: `/populacao`. Keep both routes visibly distinct. |
| Football | **Hypothesis:** a supporter arrives after a result or before a match and asks what matters for their club. Start with its dated outlook in the league context. | Test the published effect of one upcoming match outcome. | Primary: `/desporto/liga`; secondary: `/desporto/liga/simulador`. |
| Economy | **Hypothesis:** a news reader asks what a headline means, beginning with inflation or a new release. Give a plain explanation or, when data are current, one dated reading with its evidence. | Learn definitions and limits before drawing a conclusion. | Paused feed: `/economia#compreender`; current feed: `/economia`. |
| Elections | **Hypothesis:** during a campaign, a reader asks what might happen; after voting, they ask what the forecast said at the time. The available off-season job is to locate and read an archived forecast without mistaking it for an official result or performance score. | Learn how to distinguish vote estimates, winning probabilities and uncertainty. | Primary: the selected archive route under `/eleicoes`; orientation: `/eleicoes/arquivo`. |

## Implemented hierarchy

The economy entrance now leads with an interpretable question while its feed is paused, and with a dated reading and evidence when live. The elections entrance now leads with the archival task, lists the available forecasts before the reading guide, and says that it does not provide official results or a calculated evaluation.

The next evidence needed is task research: ask a reader to explain an inflation headline, find an archived forecast date and interpretation, identify what a match means for a selected club, and decide whether the population release fits a real study. Observe whether the intended destination answers the question without visitors scanning unrelated panels.

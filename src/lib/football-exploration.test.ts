import { describe, expect, it } from 'vitest';
import { conditionalProbabilities, rankMatches, readFootballExplorationState, writeFootballExplorationState, shouldPushSelectionState } from './football-exploration';
import type { NextMatchdayScenarios } from '@/types/football';
const base={p_champion:0.3,p_top3:0.8,p_relegation:0.1};
function match(values:number[]) {return {home_team:'A',away_team:'B',conditionals:Object.fromEntries(['H','D','A'].map((outcome,i)=>[outcome,{teams:{A:{...base,p_champion:values[i]}}}]))};}
const data={matchday:1,baseline:{A:base,B:{...base,p_champion:0.7}},matches:[match([.29,.3,.31]),match([.1,.3,.6])]} as unknown as NextMatchdayScenarios;
describe('focused football exploration',()=>{
 it('ranks a rival match by its actual effect, without changing source indexes',()=>{expect(rankMatches(data,'A','p_champion').map(m=>m.index)).toEqual([1,0]);});
 it('uses the selected conditional directly and retains a missing team baseline',()=>{const result=conditionalProbabilities(data,{index:1,outcome:'A'});expect(result.A.p_champion).toBe(.6);expect(result.B).toEqual(data.baseline.B);expect(data.baseline.A.p_champion).toBe(.3);});
 it('restores baseline when cleared or the match is unavailable',()=>{expect(conditionalProbabilities(data)).toEqual(data.baseline);expect(conditionalProbabilities(data,{index:90,outcome:'H'})).toEqual(data.baseline);});
 it('ranks independently for the chosen objective',()=>{expect(rankMatches(data,'A','p_relegation').map(m=>m.index)).toEqual([0,1]);});
 it('restores only a valid, version-matched single conditional selection',()=>{
   expect(readFootballExplorationState('?v=current&team=A&goal=p_relegation&pick=1:A','current',data)).toEqual({state:{team:'A',objective:'p_relegation',selection:{index:1,outcome:'A'}},resetForVersion:false});
   expect(readFootballExplorationState('?v=current&team=missing&pick=1:Z','current',data)).toEqual({state:{objective:'p_champion'},resetForVersion:false});
 });
 it('resets a stale version and writes an unambiguous share state',()=>{
   expect(readFootballExplorationState('?v=old&team=A&pick=1:H','current',data)).toEqual({state:{},resetForVersion:true});
   expect(writeFootballExplorationState('?source=club&picks=0:H,1:A','current',{team:'A',objective:'p_champion',selection:{index:1,outcome:'D'}})).toBe('source=club&v=current&team=A&goal=p_champion&pick=1%3AD');
 });
 it('pushes history only for a selection change on an unchanged team+objective, so Back undoes one pick at a time',()=>{
   const base={team:'A',objective:'p_champion',pick:''};
   expect(shouldPushSelectionState(base,{...base,pick:'0:H'})).toBe(true);
   expect(shouldPushSelectionState({...base,pick:'0:H'},{...base,pick:'0:D'})).toBe(true);
 });
 it('replaces (does not push) when the team or objective changes, even alongside a pick change',()=>{
   const base={team:'A',objective:'p_champion',pick:'0:H'};
   expect(shouldPushSelectionState(base,{...base,team:'B'})).toBe(false);
   expect(shouldPushSelectionState(base,{...base,objective:'p_relegation'})).toBe(false);
   expect(shouldPushSelectionState(base,{team:'B',objective:'p_relegation',pick:'1:A'})).toBe(false);
 });
 it('does not push when nothing changed',()=>{
   const state={team:'A',objective:'p_champion',pick:'0:H'};
   expect(shouldPushSelectionState(state,{...state})).toBe(false);
 });
});

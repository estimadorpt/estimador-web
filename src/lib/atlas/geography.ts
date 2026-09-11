import places from './places.json';
export const MUNICIPALITIES = places.municipalities;
export function municipalityFor(code: string) { return MUNICIPALITIES.find(m=>m.code===code); }
export function geographySelection(region: string, municipality: string|null, parish: string|null) {
  const town=municipalityFor(municipality??'');
  if(!town||town.region!==region)return {municipality:'',parish:''};
  return {municipality:town.code,parish:town.parishes.some(p=>p.code===parish)?parish!:''};
}

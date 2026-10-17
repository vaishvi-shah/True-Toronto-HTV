/** Approximate neighborhood representative points and workplace entrances (longitude, latitude).
 * ORS routes are estimates from these points, not door-to-door addresses.
 */
export const AREA_ROUTING_COORDINATES: Record<string, [number, number]> = {
  'scarborough-centre': [-79.2578, 43.7731],
  'islington-etobicoke': [-79.5232, 43.6452],
  'downtown-east': [-79.3640, 43.6570],
  'high-park-junction': [-79.4630, 43.6620],
  'north-york-centre': [-79.4120, 43.7680],
  'thorncliffe-park': [-79.3490, 43.7050],
  'parkdale-little-portugal': [-79.4300, 43.6410],
  'danforth-east-york': [-79.3300, 43.6850],
  'weston-mount-dennis': [-79.5020, 43.7010],
  'malvern-rouge': [-79.1900, 43.8060],
};

export const WORKPLACE_ROUTING_COORDINATES: Record<string, [number, number]> = {
  'downtown-hospital': [-79.3882, 43.6576],
  'downtown-financial': [-79.3817, 43.6487],
  'north-york-centre': [-79.4111, 43.7625],
  'pearson-logistics': [-79.6207, 43.6856],
  'scarborough-centre': [-79.2570, 43.7750],
};

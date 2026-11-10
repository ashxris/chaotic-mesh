import { readable, writable } from "svelte/store";
import { palettePresets } from "../../presets/palettes";

export const meshId = writable(757);

/*----------------------------------------------------------------
      --gradient-color-1: #eb75b6;
      --gradient-color-2: #ddf3ff;
      --gradient-color-3: #6e3deb;
      --gradient-color-4: #c92f3c;
*/
export const inputColors = writable([
  "#eb75b6",
  "#ddf3ff",
  "#6e3deb",
  "#c92f3c",
]);

export const presets = readable(palettePresets);

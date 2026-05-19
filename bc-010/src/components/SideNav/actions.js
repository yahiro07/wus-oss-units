export const TOGGLE_SIDENAV = "TOGGLE_SIDENAV";
export const CHANGE_PRESET = "CHANGE_PRESET";
export const SHOW_SIDENAV = "SHOW_SIDENAV";
export const CHANGE_THEME = "CHANGE_THEME";

export function toggleSidenav() {
  return {
    type: "TOGGLE_SIDENAV",
  };
}

export function showSidenav(isSidenavShown) {
  return {
    type: "SHOW_SIDENAV",
    isSidenavShown,
  };
}

export function changePreset(presetName) {
  return {
    type: "CHANGE_PRESET",
    presetId: presetName.id,
    presetName: presetName.name,
  };
}

export function changeTheme(themeName) {
  return {
    type: "CHANGE_THEME",
    themeName,
  };
}

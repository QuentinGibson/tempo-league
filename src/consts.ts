export const kGamesFeatures = new Map<number, string[]>([
  // League of Legends
  [
    5426,
    [
      'live_client_data',
      'matchState',
      'match_info',
      'death',
      'respawn',
      'abilities',
      'kill',
      'assist',
      'gold',
      'minions',
      'summoner_info',
      'gameMode',
      'teams',
      'level',
      'announcer',
      'counters',
      'damage',
      'heal'
    ]
  ],
  // League of Legends Launcher
  [
    10902,
    [
      'game_flow',
      'summoner_info',
      'champ_select',
      'lobby_info',
      'end_game',
      'lcu_info',
      'game_info',
      'clash'
    ]
  ],
]);

export const kGameClassIds = Array.from(kGamesFeatures.keys());

export const kLauncherClassId = 10902;

export const kWindowNames = {
  inGame: 'in_game',
  desktop: 'desktop',
  desktopSecond: 'desktop_second'
};

export const kHotkeys = {
  toggle: 'tempo_league_toggle'
};

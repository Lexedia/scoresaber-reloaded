export type CPConfig = {
  /** Tailwind classes to apply to the player's name */
  nameClass?: string;
  /** Tailwind classes to apply to the player's avatar */
  avatarClass?: string;
}

export const CPPresets = {
  developer: {
    nameClass: 'bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent font-bold drop-shadow-sm',
    avatarClass: 'border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.6)]',
  },
  coolPerson: {
    nameClass: 'bg-gradient-to-r from-blue-400 via-sky-400 to-cyan-400 bg-clip-text text-transparent font-bold drop-shadow-sm',
    avatarClass: 'border-2 border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.6)]',
  },
} satisfies Record<string, CPConfig>

// CP = Cool People, please, dont...
export const CP_USERS: Record<string, CPConfig> = {
  // Lexie
  '76561198854909134': CPPresets.developer,
  // Fatboy my goat
  '76561198848132734': {
    nameClass: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 bg-clip-text text-transparent font-bold drop-shadow-sm',
    avatarClass: 'border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.6)]',
  },

  // Schlopley
  '76561199002810654': CPPresets.coolPerson,
  // Parmesan
  '76561198166144902': CPPresets.coolPerson,
}

export function getCPConfig(playerId: string | undefined): CPConfig | undefined {
  if (!playerId) {
    return undefined
  }
  return CP_USERS[playerId]
}

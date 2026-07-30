// Utility mapping from operator names (including aliases) to logo paths in public folder
export const operatorLogoMap = {
  Telkomsel: '/operator_logos/logo_telkomsel.png',
  XL: '/operator_logos/logo_xl.png',
  Indosat: '/operator_logos/logo_indosat.png',
  Axis: '/operator_logos/logo_axis.png',
  Tri: '/operator_logos/logo_tri.png',
  Smartfren: '/operator_logos/logo_smartfrend.png', // matches actual filename "logo_smartfrend.png"
} as const;

type OperatorKey = keyof typeof operatorLogoMap;

// Aliases map: alternate operator names that should resolve to the same logo key
export const operatorAliasMap: Record<string, OperatorKey> = {
  IM3: 'Indosat',
  Ooredo: 'Indosat',
  'IM3 Ooredo': 'Indosat',
  // Add more variants here if needed (e.g., 'Smartfren'?: 'Smartfren')
  // Note: the question mark was a typo; remove if adding
};

/**
 * Returns the logo URL for the given operator string if it matches a known operator or its alias.
 Returns null otherwise.
 * Matching is case-insensitive and trims whitespace.
 */
export function getOperatorLogoPath(operator: string | null): string | null {
  if (!operator) return null;

  const trimmed = operator.trim();
  // Try direct matching first
  const entry = Object.entries(operatorLogoMap).find(([key]) => {
    const keyLower = key.toLowerCase();
    return keyLower === trimmed.toLowerCase();
  });
  if (entry) return entry[1];

  // If no direct match, check alias map
  for (const [aliasStr, canonicalKey] of Object.entries(operatorAliasMap)) {
    if (aliasStr.toLowerCase() === trimmed.toLowerCase()) {
      // Look up canonical key in operatorLogoMap
      const logoUrl = operatorLogoMap[canonicalKey];
      if (logoUrl !== undefined) return logoUrl;
    }
  }

  return null;
}

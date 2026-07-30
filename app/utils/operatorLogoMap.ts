import { operatorLogoMap } from './operatorLogoMap.generated';

export { operatorLogoMap };

export type OperatorKey = keyof typeof operatorLogoMap;

// Aliases map: alternate operator names that should resolve to the same logo key
export const operatorAliasMap: Record<string, OperatorKey> = {
  IM3: 'Indosat' as OperatorKey,
  Ooredo: 'Indosat' as OperatorKey,
  Ooredoo: 'Indosat' as OperatorKey,
  'IM3 Ooredoo': 'Indosat' as OperatorKey,
  // XL Axiata variations
  'XL Axiata': 'XL' as OperatorKey,
  'XLAxiata': 'XL' as OperatorKey,
  // Add more variants here if needed
};

/**
 * Returns the logo URL for the given operator string if it matches a known operator or its alias.
 * Returns null otherwise.
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

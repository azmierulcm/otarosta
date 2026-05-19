// ─────────────────────────────────────────────────────────────────────────────
// Parser version constant — shared between server actions and server modules.
//
// Bump MAJOR when stored data model changes (new duty types, schema changes).
// Bump MINOR when extraction logic improves (better port detection, new codes).
// Bump PATCH for bug fixes that don't change the output structure.
//
// All Firestore roster documents carry this version stamp so future migration
// sweeps can precisely identify documents that may benefit from re-parsing.
// ─────────────────────────────────────────────────────────────────────────────

export const PARSER_VERSION = '2.1.0';

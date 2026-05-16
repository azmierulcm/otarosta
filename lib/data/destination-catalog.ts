export type DestinationRegion = 'sea' | 'east' | 'oce' | 'mena' | 'eur' | 'saf';

export interface CatalogEntry {
  iata: string;
  city: string;
  country: string;
  region: DestinationRegion;
  isHome?: boolean;
  /** City name in the destination's local script — shown as a stamp on each patch card */
  localName?: string;
}

/** Region → CSS custom property mapping */
export const REGION_COLORS: Record<DestinationRegion, string> = {
  sea:  'var(--patch-sea)',  // warm sienna   — Southeast Asia + Malaysia domestic
  east: 'var(--patch-east)', // deep crimson   — East Asia
  oce:  'var(--patch-oce)',  // forest green   — Oceania
  mena: 'var(--patch-mena)', // magenta-rose   — Middle East
  eur:  'var(--patch-eur)',  // navy blue      — Europe
  saf:  'var(--patch-saf)',  // teak brown     — South Asia
};

/**
 * Every airport Malaysia Airlines (MH) currently serves.
 * Source: flightconnections.com/route-map-malaysia-airlines-mh
 * Total: 72 destinations
 */
export const DESTINATION_CATALOG: CatalogEntry[] = [

  // ── Malaysia Domestic (16) ────────────────────────────────────────────────
  // Jawi script is Malaysia's co-official Arabic-derived script — used on all Malaysian patches
  { iata: 'KUL', city: 'Kuala Lumpur',       country: 'Malaysia',     region: 'sea', isHome: true, localName: 'كوالا لومڤور' },
  { iata: 'AOR', city: 'Alor Setar',         country: 'Malaysia',     region: 'sea', localName: 'الور ستار' },
  { iata: 'BTU', city: 'Bintulu',            country: 'Malaysia',     region: 'sea', localName: 'بينتولو' },
  { iata: 'JHB', city: 'Johor Bahru',        country: 'Malaysia',     region: 'sea', localName: 'جوهر بهرو' },
  { iata: 'KBR', city: 'Kota Bharu',         country: 'Malaysia',     region: 'sea', localName: 'كوتا بهارو' },
  { iata: 'BKI', city: 'Kota Kinabalu',      country: 'Malaysia',     region: 'sea', localName: 'كوتا كينابالو' },
  { iata: 'TGG', city: 'Kuala Terengganu',   country: 'Malaysia',     region: 'sea', localName: 'كوالا ترڠڬانو' },
  { iata: 'KUA', city: 'Kuantan',            country: 'Malaysia',     region: 'sea', localName: 'كوانتن' },
  { iata: 'KCH', city: 'Kuching',            country: 'Malaysia',     region: 'sea', localName: 'كوچيڠ' },
  { iata: 'LBU', city: 'Labuan',             country: 'Malaysia',     region: 'sea', localName: 'لابوان' },
  { iata: 'LGK', city: 'Langkawi',           country: 'Malaysia',     region: 'sea', localName: 'لاڠكاوي' },
  { iata: 'MYY', city: 'Miri',               country: 'Malaysia',     region: 'sea', localName: 'ميري' },
  { iata: 'PEN', city: 'Penang',             country: 'Malaysia',     region: 'sea', localName: 'ڤولاو ڤينڠ' },
  { iata: 'SDK', city: 'Sandakan',           country: 'Malaysia',     region: 'sea', localName: 'صنداكن' },
  { iata: 'SBW', city: 'Sibu',               country: 'Malaysia',     region: 'sea', localName: 'سيبو' },
  { iata: 'TWU', city: 'Tawau',              country: 'Malaysia',     region: 'sea', localName: 'تاواو' },

  // ── Southeast Asia (18) ──────────────────────────────────────────────────
  { iata: 'SIN', city: 'Singapore',          country: 'Singapore',    region: 'sea', localName: '新加坡' },
  { iata: 'BKK', city: 'Bangkok',            country: 'Thailand',     region: 'sea', localName: 'กรุงเทพ' },
  { iata: 'CNX', city: 'Chiang Mai',         country: 'Thailand',     region: 'sea', localName: 'เชียงใหม่' },
  { iata: 'HKT', city: 'Phuket',             country: 'Thailand',     region: 'sea', localName: 'ภูเก็ต' },
  { iata: 'CGK', city: 'Jakarta',            country: 'Indonesia',    region: 'sea' },
  { iata: 'DPS', city: 'Bali',               country: 'Indonesia',    region: 'sea' },
  { iata: 'SUB', city: 'Surabaya',           country: 'Indonesia',    region: 'sea' },
  { iata: 'KNO', city: 'Medan',              country: 'Indonesia',    region: 'sea' },
  { iata: 'BPN', city: 'Balikpapan',         country: 'Indonesia',    region: 'sea' },
  { iata: 'UPG', city: 'Makassar',           country: 'Indonesia',    region: 'sea' },
  { iata: 'PKU', city: 'Pekanbaru',          country: 'Indonesia',    region: 'sea' },
  { iata: 'YIA', city: 'Yogyakarta',         country: 'Indonesia',    region: 'sea' },
  { iata: 'MNL', city: 'Manila',             country: 'Philippines',  region: 'sea', localName: 'Maynilà' },
  { iata: 'RGN', city: 'Yangon',             country: 'Myanmar',      region: 'sea', localName: 'ရန်ကုန်' },
  { iata: 'HAN', city: 'Hanoi',              country: 'Vietnam',      region: 'sea', localName: 'Hà Nội' },
  { iata: 'SGN', city: 'Ho Chi Minh City',   country: 'Vietnam',      region: 'sea', localName: 'Hồ Chí Minh' },
  { iata: 'DAD', city: 'Da Nang',            country: 'Vietnam',      region: 'sea', localName: 'Đà Nẵng' },
  { iata: 'PNH', city: 'Phnom Penh',         country: 'Cambodia',     region: 'sea', localName: 'ភ្នំពេញ' },

  // ── East Asia (13) ───────────────────────────────────────────────────────
  { iata: 'HKG', city: 'Hong Kong',          country: 'Hong Kong',    region: 'east', localName: '香港' },
  { iata: 'CAN', city: 'Guangzhou',          country: 'China',        region: 'east', localName: '广州' },
  { iata: 'PVG', city: 'Shanghai',           country: 'China',        region: 'east', localName: '上海' },
  { iata: 'PKX', city: 'Beijing',            country: 'China',        region: 'east', localName: '北京' },
  { iata: 'SZX', city: 'Shenzhen',           country: 'China',        region: 'east', localName: '深圳' },
  { iata: 'XMN', city: 'Xiamen',             country: 'China',        region: 'east', localName: '厦门' },
  { iata: 'CSX', city: 'Changsha',           country: 'China',        region: 'east', localName: '长沙' },
  { iata: 'TFU', city: 'Chengdu',            country: 'China',        region: 'east', localName: '成都' },
  { iata: 'NRT', city: 'Tokyo',              country: 'Japan',        region: 'east', localName: '東京' },
  { iata: 'KIX', city: 'Osaka',              country: 'Japan',        region: 'east', localName: '大阪' },
  { iata: 'FUK', city: 'Fukuoka',            country: 'Japan',        region: 'east', localName: '福岡' },
  { iata: 'ICN', city: 'Seoul',              country: 'South Korea',  region: 'east', localName: '서울' },
  { iata: 'TPE', city: 'Taipei',             country: 'Taiwan',       region: 'east', localName: '台北' },

  // ── Oceania (6) ──────────────────────────────────────────────────────────
  { iata: 'SYD', city: 'Sydney',             country: 'Australia',    region: 'oce' },
  { iata: 'MEL', city: 'Melbourne',          country: 'Australia',    region: 'oce' },
  { iata: 'BNE', city: 'Brisbane',           country: 'Australia',    region: 'oce' },
  { iata: 'PER', city: 'Perth',              country: 'Australia',    region: 'oce' },
  { iata: 'ADL', city: 'Adelaide',           country: 'Australia',    region: 'oce' },
  { iata: 'AKL', city: 'Auckland',           country: 'New Zealand',  region: 'oce', localName: 'Tāmaki Makaurau' },

  // ── Middle East (3) ──────────────────────────────────────────────────────
  { iata: 'DOH', city: 'Doha',               country: 'Qatar',        region: 'mena', localName: 'الدوحة' },
  { iata: 'JED', city: 'Jeddah',             country: 'Saudi Arabia', region: 'mena', localName: 'جدة' },
  { iata: 'MED', city: 'Medina',             country: 'Saudi Arabia', region: 'mena', localName: 'المدينة المنورة' },

  // ── Europe (2) ───────────────────────────────────────────────────────────
  { iata: 'LHR', city: 'London',             country: 'United Kingdom', region: 'eur' },
  { iata: 'CDG', city: 'Paris',              country: 'France',       region: 'eur' },

  // ── South Asia (14) ──────────────────────────────────────────────────────
  { iata: 'BOM', city: 'Mumbai',             country: 'India',        region: 'saf', localName: 'मुंबई' },
  { iata: 'DEL', city: 'New Delhi',          country: 'India',        region: 'saf', localName: 'नई दिल्ली' },
  { iata: 'BLR', city: 'Bengaluru',          country: 'India',        region: 'saf', localName: 'ಬೆಂಗಳೂರು' },
  { iata: 'MAA', city: 'Chennai',            country: 'India',        region: 'saf', localName: 'சென்னை' },
  { iata: 'HYD', city: 'Hyderabad',          country: 'India',        region: 'saf', localName: 'హైదరాబాద్' },
  { iata: 'CCU', city: 'Kolkata',            country: 'India',        region: 'saf', localName: 'কলকাতা' },
  { iata: 'COK', city: 'Kochi',              country: 'India',        region: 'saf', localName: 'കൊച്ചി' },
  { iata: 'AMD', city: 'Ahmedabad',          country: 'India',        region: 'saf', localName: 'અમદાવાદ' },
  { iata: 'ATQ', city: 'Amritsar',           country: 'India',        region: 'saf', localName: 'ਅੰਮ੍ਰਿਤਸਰ' },
  { iata: 'TRV', city: 'Thiruvananthapuram', country: 'India',        region: 'saf', localName: 'തിരുവനന്തപുരം' },
  { iata: 'DAC', city: 'Dhaka',              country: 'Bangladesh',   region: 'saf', localName: 'ঢাকা' },
  { iata: 'CMB', city: 'Colombo',            country: 'Sri Lanka',    region: 'saf', localName: 'කොළඹ' },
  { iata: 'MLE', city: 'Malé',               country: 'Maldives',     region: 'saf', localName: 'މާލެ' },
  { iata: 'KTM', city: 'Kathmandu',          country: 'Nepal',        region: 'saf', localName: 'काठमाडौं' },

  // 16 + 18 + 13 + 6 + 3 + 2 + 14 = 72
];

export const CATALOG_SIZE = DESTINATION_CATALOG.length; // 72

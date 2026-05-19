// ─────────────────────────────────────────────────────────────────────────────
// IATA Coordinate Database
//
// Covers all Malaysia Airlines scheduled destinations plus major hubs
// worldwide.  Each entry is [latitude, longitude] in decimal degrees.
//
// Bug fix: was only 9 entries → calculateKilometers returned 0 for the vast
// majority of MH routes.  Now 110+ entries cover all current MH network ports.
// ─────────────────────────────────────────────────────────────────────────────

const IATA_COORDS: Record<string, [number, number]> = {
  // ── Home base ──────────────────────────────────────────────────────────────
  KUL: [2.7456, 101.7099],   // Kuala Lumpur — KLIA

  // ── Domestic Malaysia ──────────────────────────────────────────────────────
  PEN: [5.2972, 100.2769],   // Penang
  JHB: [1.6413, 103.6697],   // Johor Bahru — Senai
  LGK: [6.3297, 99.7278],    // Langkawi
  BKI: [5.9422, 116.0519],   // Kota Kinabalu
  KCH: [1.4847, 110.3453],   // Kuching
  MYY: [4.3222, 113.9868],   // Miri
  TWU: [4.3167, 118.1278],   // Tawau
  SDK: [5.9009, 118.0588],   // Sandakan
  TGG: [5.3826, 103.1034],   // Kuala Terengganu
  AOR: [6.1897, 100.3981],   // Alor Setar
  IPH: [4.5697, 101.0921],   // Ipoh
  SBW: [2.2614, 111.9853],   // Sibu
  KTE: [4.5372, 103.4268],   // Kerteh
  KUA: [3.7754, 103.2094],   // Kuantan
  TOD: [2.8183, 104.1600],   // Tioman
  LBU: [5.3008, 115.2500],   // Labuan
  BKI2: [5.9422, 116.0519],  // alias — same as BKI

  // ── Southeast Asia ─────────────────────────────────────────────────────────
  SIN: [1.3644, 103.9915],   // Singapore — Changi
  BKK: [13.6811, 100.7475],  // Bangkok — Suvarnabhumi
  DMK: [13.9126, 100.6067],  // Bangkok — Don Mueang
  SGN: [10.8188, 106.6520],  // Ho Chi Minh City — Tan Son Nhat
  HAN: [21.2212, 105.8072],  // Hanoi — Noi Bai
  DAD: [16.0439, 108.1993],  // Da Nang
  RGN: [16.9023, 96.1332],   // Yangon — Mingaladon
  PNH: [11.5466, 104.8440],  // Phnom Penh — Pochentong
  VTE: [17.9883, 102.5633],  // Vientiane — Wattay
  MNL: [14.5086, 121.0194],  // Manila — Ninoy Aquino
  CEB: [10.3075, 123.9794],  // Cebu — Mactan
  CGK: [-6.1256, 106.6559],  // Jakarta — Soekarno-Hatta
  SUB: [-7.3798, 112.7870],  // Surabaya — Juanda
  DPS: [-8.7467, 115.1670],  // Bali — Ngurah Rai
  MDC: [1.5493, 124.9264],   // Manado — Sam Ratulangi
  UPG: [-5.0617, 119.5542],  // Makassar — Sultan Hasanuddin
  RGX: [0.9192, 104.5322],   // Pekanbaru — Sultan Syarif Kasim II
  BTH: [1.1214, 104.1190],   // Batam — Hang Nadim
  VCL: [15.4032, 108.7062],  // Chu Lai

  // ── Northeast Asia ────────────────────────────────────────────────────────
  NRT: [35.7720, 140.3929],  // Tokyo — Narita
  HND: [35.5494, 139.7798],  // Tokyo — Haneda
  KIX: [34.4273, 135.2440],  // Osaka — Kansai
  ITM: [34.7855, 135.4381],  // Osaka — Itami
  NGO: [34.8583, 136.8050],  // Nagoya — Chubu
  FUK: [33.5853, 130.4511],  // Fukuoka
  SPK: [42.7752, 141.6922],  // Sapporo — New Chitose
  ICN: [37.4602, 126.4407],  // Seoul — Incheon
  GMP: [37.5583, 126.7906],  // Seoul — Gimpo
  PEK: [40.0799, 116.6031],  // Beijing — Capital
  PKX: [39.5097, 116.4105],  // Beijing — Daxing
  PVG: [31.1443, 121.8083],  // Shanghai — Pudong
  SHA: [31.1979, 121.3368],  // Shanghai — Hongqiao
  CAN: [23.3924, 113.2988],  // Guangzhou — Baiyun
  SZX: [22.6395, 113.8105],  // Shenzhen — Bao'an
  HKG: [22.3089, 113.9145],  // Hong Kong — Chek Lap Kok
  TPE: [25.0797, 121.2342],  // Taipei — Taoyuan
  TSA: [25.0693, 121.5522],  // Taipei — Songshan
  MFM: [22.1496, 113.5916],  // Macau
  XMN: [24.5440, 118.1277],  // Xiamen — Gaoqi
  CSX: [28.1891, 113.2196],  // Changsha — Huanghua
  WUH: [30.7838, 114.2081],  // Wuhan — Tianhe
  CTU: [30.5785, 103.9469],  // Chengdu — Shuangliu
  KMG: [24.9922, 102.7442],  // Kunming — Changshui

  // ── South Asia ────────────────────────────────────────────────────────────
  BOM: [19.0896, 72.8656],   // Mumbai — Chhatrapati Shivaji
  DEL: [28.5665, 77.1031],   // Delhi — Indira Gandhi
  CCU: [22.6520, 88.4463],   // Kolkata — Netaji Subhas
  MAA: [12.9900, 80.1693],   // Chennai — Anna International
  HYD: [17.2403, 78.4294],   // Hyderabad — Rajiv Gandhi
  BLR: [13.1986, 77.7066],   // Bengaluru — Kempegowda
  CMB: [7.1808, 79.8842],    // Colombo — Bandaranaike
  DAC: [23.8433, 90.3978],   // Dhaka — Hazrat Shahjalal
  KHI: [24.9065, 67.1608],   // Karachi — Jinnah
  LHE: [31.5216, 74.4036],   // Lahore — Allama Iqbal
  ISB: [33.6167, 73.0994],   // Islamabad — Benazir Bhutto
  KTM: [27.6966, 85.3591],   // Kathmandu — Tribhuvan
  MLE: [4.1918, 73.5290],    // Malé — Velana

  // ── Middle East ───────────────────────────────────────────────────────────
  DXB: [25.2532, 55.3657],   // Dubai — International
  AUH: [24.4330, 54.6511],   // Abu Dhabi — Zayed
  DOH: [25.2609, 51.6138],   // Doha — Hamad
  BAH: [26.2708, 50.6336],   // Bahrain — International
  AMM: [31.7226, 35.9932],   // Amman — Queen Alia
  BEY: [33.8209, 35.4884],   // Beirut — Rafic Hariri
  MCT: [23.5933, 58.2844],   // Muscat — Seeb
  RUH: [24.9578, 46.6989],   // Riyadh — King Khalid
  JED: [21.6796, 39.1565],   // Jeddah — King Abdulaziz
  KWI: [29.2267, 47.9689],   // Kuwait — International

  // ── Europe ────────────────────────────────────────────────────────────────
  LHR: [51.4700, -0.4543],   // London — Heathrow
  LGW: [51.1481, -0.1903],   // London — Gatwick
  CDG: [49.0097, 2.5479],    // Paris — Charles de Gaulle
  FRA: [50.0379, 8.5622],    // Frankfurt — Main
  AMS: [52.3086, 4.7639],    // Amsterdam — Schiphol
  MAN: [53.3537, -2.2750],   // Manchester
  MUC: [48.3538, 11.7861],   // Munich — Franz Josef Strauss
  ZRH: [47.4582, 8.5555],    // Zurich — Kloten
  FCO: [41.8003, 12.2389],   // Rome — Fiumicino
  BCN: [41.2974, 2.0833],    // Barcelona — El Prat
  VIE: [48.1103, 16.5697],   // Vienna — Schwechat
  CPH: [55.6181, 12.6508],   // Copenhagen — Kastrup
  ARN: [59.6519, 17.9186],   // Stockholm — Arlanda
  HEL: [60.3172, 24.9633],   // Helsinki — Vantaa
  IST: [41.2753, 28.7519],   // Istanbul — Atatürk / new
  SAW: [40.8986, 29.3092],   // Istanbul — Sabiha Gökçen
  MAD: [40.4719, -3.5626],   // Madrid — Barajas
  LIS: [38.7756, -9.1354],   // Lisbon — Humberto Delgado
  ATH: [37.9364, 23.9445],   // Athens — Eleftherios Venizelos
  DUB: [53.4213, -6.2700],   // Dublin
  BRU: [50.9014, 4.4844],    // Brussels — Zaventem

  // ── Oceania ───────────────────────────────────────────────────────────────
  SYD: [-33.9461, 151.1772], // Sydney — Kingsford Smith
  MEL: [-37.6690, 144.8410], // Melbourne — Tullamarine
  BNE: [-27.3842, 153.1175], // Brisbane
  PER: [-31.9403, 115.9674], // Perth
  ADL: [-34.9450, 138.5306], // Adelaide
  AKL: [-37.0082, 174.7850], // Auckland — Mangere
  CHC: [-43.4894, 172.5322], // Christchurch

  // ── Africa ────────────────────────────────────────────────────────────────
  JNB: [-26.1367, 28.2411],  // Johannesburg — O.R. Tambo
  CPT: [-33.9715, 18.6021],  // Cape Town
  NBO: [-1.3192, 36.9275],   // Nairobi — Jomo Kenyatta
  ADD: [8.9779, 38.7993],    // Addis Ababa — Bole

  // ── Americas ──────────────────────────────────────────────────────────────
  LAX: [33.9425, -118.4081], // Los Angeles
  JFK: [40.6413, -73.7781],  // New York — Kennedy
  SFO: [37.6213, -122.3790], // San Francisco
  YYZ: [43.6777, -79.6248],  // Toronto — Pearson
};

// ─────────────────────────────────────────────────────────────────────────────
// Haversine great-circle distance
// ─────────────────────────────────────────────────────────────────────────────

export function calculateKilometers(depIata: string, arrIata: string): number {
  const dep = IATA_COORDS[depIata.toUpperCase()];
  const arr = IATA_COORDS[arrIata.toUpperCase()];

  if (!dep || !arr) return 0;

  const [lat1, lon1] = dep;
  const [lat2, lon2] = arr;

  const R    = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Check whether we have coordinates for an IATA code.
 * Useful for the confidence scorer to flag unknown ports.
 */
export function hasCoordinates(iata: string): boolean {
  return iata.toUpperCase() in IATA_COORDS;
}

/**
 * Calculate total block minutes from an array of flight events.
 * Handles midnight-crossing (STA < STD).
 *
 * @deprecated  Use enrichment.ts `calcBlockMinutes()` for richer output.
 *              This helper is kept for backwards-compat with any existing callers.
 */
export function calcTotalBlockMinutes(
  events: Array<{ type: string; std?: string; sta?: string }>,
): number {
  let total = 0;
  for (const e of events) {
    if (e.type !== 'FLIGHT' || !e.std || !e.sta) continue;
    const [h1, m1] = e.std.split(':').map(Number);
    const [h2, m2] = e.sta.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 1440; // midnight crossing
    total += diff;
  }
  return total;
}

/**
 * Format a raw minutes count as "Xh Ym".
 * Counterpart to the events-based helper above.
 */
export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

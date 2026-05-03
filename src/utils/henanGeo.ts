export const CITY_COORDS: Record<string, [number, number]> = {
  安阳: [114.3924, 36.0977],
  鹤壁: [114.2973, 35.7554],
  濮阳: [115.0413, 35.7682],
  焦作: [113.2418, 35.2159],
  郑州: [113.6254, 34.7466],
  开封: [114.3143, 34.7973],
  商丘: [115.6563, 34.4140],
  洛阳: [112.4540, 34.6197],
  三门峡: [111.2003, 34.7725],
  平顶山: [113.1924, 33.7661],
  许昌: [113.8520, 34.0357],
  漯河: [114.0168, 33.5815],
  周口: [114.6497, 33.6204],
  驻马店: [114.0247, 32.9802],
  南阳: [112.5283, 32.9908],
  信阳: [114.0920, 32.1470],
  济源: [112.6020, 35.0670],
};

export const HENAN_VIEWBOX = { width: 1000, height: 760 };
export const HENAN_OUTLINE_POINTS: Array<[number, number]> = [
  [242, 82], [336, 56], [426, 76], [522, 68], [622, 90], [734, 90], [822, 124],
  [894, 182], [942, 240], [974, 322], [986, 404], [962, 496], [914, 560], [880, 656],
  [814, 716], [700, 736], [606, 720], [512, 704], [422, 702], [324, 718], [248, 694],
  [184, 632], [126, 560], [92, 464], [76, 386], [92, 302], [126, 218], [178, 148],
];

const HERO_ROUTE_NAMES = ["安阳", "郑州", "开封", "商丘", "洛阳", "南阳"] as const;

const GEO_BOUNDS = { minLon: 110.8, maxLon: 116.4, minLat: 31.8, maxLat: 36.5 };
const PADDING_X = 110;
const PADDING_Y = 70;

function lonLatToViewbox([lon, lat]: [number, number]) {
  const usableW = HENAN_VIEWBOX.width - PADDING_X * 2;
  const usableH = HENAN_VIEWBOX.height - PADDING_Y * 2;
  const x = PADDING_X + ((lon - GEO_BOUNDS.minLon) / (GEO_BOUNDS.maxLon - GEO_BOUNDS.minLon)) * usableW;
  const y = PADDING_Y + ((GEO_BOUNDS.maxLat - lat) / (GEO_BOUNDS.maxLat - GEO_BOUNDS.minLat)) * usableH;
  return { x, y };
}

export const HERO_ROUTE = HERO_ROUTE_NAMES.map((name) => ({
  name,
  coord: CITY_COORDS[name],
  ...lonLatToViewbox(CITY_COORDS[name]),
}));

export function cityGeo(name: string) {
  return CITY_COORDS[name] ?? null;
}

/**
 * WGS-84 转 GCJ-02 (火星坐标系)
 * 用于修正中国地图坐标偏移问题
 */
function wgs84ToGcj02(lon: number, lat: number): [number, number] {
  const a = 6378245.0; // 长半轴
  const ee = 0.00669342162296594323; // 偏心率平方

  // 判断是否在中国境外
  if (isOutOfChina(lon, lat)) {
    return [lon, lat];
  }

  let dLat = transformLat(lon - 105.0, lat - 35.0);
  let dLon = transformLon(lon - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((a * (1 - ee)) / (magic * sqrtMagic)) * Math.PI);
  dLon = (dLon * 180.0) / ((a / sqrtMagic) * Math.cos(radLat) * Math.PI);
  const mgLat = lat + dLat;
  const mgLon = lon + dLon;
  return [mgLon, mgLat];
}

function transformLat(lon: number, lat: number): number {
  let ret = -100.0 + 2.0 * lon + 3.0 * lat + 0.2 * lat * lat + 0.1 * lon * lat + 0.2 * Math.sqrt(Math.abs(lon));
  ret += ((20.0 * Math.sin(6.0 * lon * Math.PI) + 20.0 * Math.sin(2.0 * lon * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin((lat / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((lat / 12.0) * Math.PI) + 320 * Math.sin((lat * Math.PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLon(lon: number, lat: number): number {
  let ret = 300.0 + lon + 2.0 * lat + 0.1 * lon * lon + 0.1 * lon * lat + 0.1 * Math.sqrt(Math.abs(lon));
  ret += ((20.0 * Math.sin(6.0 * lon * Math.PI) + 20.0 * Math.sin(2.0 * lon * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(lon * Math.PI) + 40.0 * Math.sin((lon / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((lon / 12.0) * Math.PI) + 300.0 * Math.sin((lon / 30.0) * Math.PI)) * 2.0) / 3.0;
  return ret;
}

function isOutOfChina(lon: number, lat: number): boolean {
  return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

export function projectLonLatToGeo(lon: number, lat: number): [number, number] {
  // 将 WGS-84 坐标转换为 GCJ-02 坐标
  return wgs84ToGcj02(lon, lat);
}

export function toPath() {
  return HENAN_OUTLINE_POINTS.map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`).join(" ") + " Z";
}

export const PENTAGON_SYMBOL =
  "path://M0,-1 L0.95,-0.25 L0.58,0.9 L-0.58,0.9 L-0.95,-0.25 Z";

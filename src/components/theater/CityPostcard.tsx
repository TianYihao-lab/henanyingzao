import { publicPath } from "../../utils/publicPath";

interface CityPostcardProps {
  city: string;
  variant?: "card" | "banner";
}

interface CitySceneConfig {
  city: string;
  accent: string;
  accentSoft: string;
  blossom: string;
  water: string;
  gateLabel: string;
  skyline: string[];
  heritage: string[];
}

interface CityImageConfig {
  src: string;
  objectPosition?: string;
}

const CITY_IMAGE_MAP: Record<string, CityImageConfig> = {
  "安阳": { src: publicPath("pictures/安阳.jpeg"), objectPosition: "center top" },
  "洛阳": { src: publicPath("pictures/洛阳.jpeg"), objectPosition: "center top" },
  "郑州": { src: publicPath("pictures/郑州.jpeg"), objectPosition: "56% top" },
  "驻马店": { src: publicPath("pictures/驻马店.jpeg"), objectPosition: "center top" },
  "商丘": { src: publicPath("pictures/商丘.jpeg"), objectPosition: "64% top" },
  "开封": { src: publicPath("pictures/开封.jpeg"), objectPosition: "center top" },
  "鹤壁": { src: publicPath("pictures/鹤壁.jpeg"), objectPosition: "center top" },
  "三门峡": { src: publicPath("pictures/三门峡.jpeg"), objectPosition: "center top" },
  "平顶山": { src: publicPath("pictures/平顶山.jpeg"), objectPosition: "center top" },
  "周口": { src: publicPath("pictures/周口.jpeg"), objectPosition: "center top" },
  "漬河": { src: publicPath("pictures/漬河.jpeg"), objectPosition: "center top" },
  "许昌": { src: publicPath("pictures/许昌.jpeg"), objectPosition: "center top" },
  "南阳": { src: publicPath("pictures/南阳.jpeg"), objectPosition: "60% top" },
};

const CITY_SCENES: Record<string, CitySceneConfig> = {

  安阳: {
    city: "安阳",
    accent: "#c56f37",
    accentSoft: "#e7b784",
    blossom: "#f5c2d7",
    water: "#9fd4dd",
    gateLabel: "殷墟",
    skyline: ["甲骨纹", "古城墙", "宫殿台基"],
    heritage: ["文峰塔", "宫殿遗址", "洹水"],
  },
  洛阳: {
    city: "洛阳",
    accent: "#c27a3b",
    accentSoft: "#e4c089",
    blossom: "#f2d8d4",
    water: "#93cad9",
    gateLabel: "应天门",
    skyline: ["牡丹", "古阙门", "洛河桥影"],
    heritage: ["应天门", "定鼎门", "龙门"],
  },
  郑州: {
    city: "郑州",
    accent: "#c66e4e",
    accentSoft: "#ebb786",
    blossom: "#f3c4d6",
    water: "#8ecfda",
    gateLabel: "商城",
    skyline: ["城垣", "商代宫城", "现代天际线"],
    heritage: ["商城城墙", "二七塔", "古都中轴"],
  },
  驻马店: {
    city: "驻马店",
    accent: "#bf7b45",
    accentSoft: "#ddb281",
    blossom: "#f1cfd5",
    water: "#9cc8d7",
    gateLabel: "驿城",
    skyline: ["古驿道", "天中古城", "平原云影"],
    heritage: ["驿站", "官道", "古城轮廓"],
  },
  商丘: {
    city: "商丘",
    accent: "#bc7443",
    accentSoft: "#e6ba8e",
    blossom: "#f5cdd0",
    water: "#95d2d8",
    gateLabel: "归德府",
    skyline: ["古城湖", "城门楼", "归德府城"],
    heritage: ["城门", "拱桥", "湖城相映"],
  },
  开封: {
    city: "开封",
    accent: "#c27e42",
    accentSoft: "#e3bb8c",
    blossom: "#efc1d6",
    water: "#8dc9d9",
    gateLabel: "州桥",
    skyline: ["州桥", "城楼", "汴梁水系"],
    heritage: ["州桥", "城门", "汴河"],
  },
  鹤壁: {
    city: "鹤壁",
    accent: "#b86c4b",
    accentSoft: "#dca886",
    blossom: "#efccd6",
    water: "#9ac9d5",
    gateLabel: "朝歌",
    skyline: ["鹿台", "古都高台", "山城云气"],
    heritage: ["朝歌遗址", "古台", "鹤鸣山色"],
  },
  三门峡: {
    city: "三门峡",
    accent: "#bf7448",
    accentSoft: "#deb48a",
    blossom: "#f3d3dd",
    water: "#89c6d5",
    gateLabel: "崤函",
    skyline: ["黄河", "峡谷桥", "函谷雄关"],
    heritage: ["函谷关", "古道", "黄河门廊"],
  },
  平顶山: {
    city: "平顶山",
    accent: "#b97444",
    accentSoft: "#ddb88f",
    blossom: "#f0c9d5",
    water: "#95cad7",
    gateLabel: "应国",
    skyline: ["山丘", "古寺", "矿脉天际线"],
    heritage: ["古寺", "山城", "门阙"],
  },
  周口: {
    city: "周口",
    accent: "#bf7c4b",
    accentSoft: "#e0bb95",
    blossom: "#f3d0da",
    water: "#92c9d8",
    gateLabel: "陈州",
    skyline: ["沙颍河", "古城楼", "渡口"],
    heritage: ["陈州城", "河港", "城门"],
  },
  漯河: {
    city: "漯河",
    accent: "#c17b46",
    accentSoft: "#e4bf8d",
    blossom: "#f2d2dc",
    water: "#90c7d5",
    gateLabel: "古桥",
    skyline: ["桥影", "河岸", "古驿埠"],
    heritage: ["古桥", "牌坊", "水岸民居"],
  },
  许昌: {
    city: "许昌",
    accent: "#bf6f41",
    accentSoft: "#e7bb87",
    blossom: "#f5ccd7",
    water: "#95cad5",
    gateLabel: "许都",
    skyline: ["曹魏宫阙", "都城门楼", "护城河"],
    heritage: ["许都", "宫阙", "古城垣"],
  },
  南阳: {
    city: "南阳",
    accent: "#bc7343",
    accentSoft: "#dfb487",
    blossom: "#efcad6",
    water: "#92c8d4",
    gateLabel: "卧龙岗",
    skyline: ["汉阙", "水岸", "书院"],
    heritage: ["汉画馆", "卧龙岗", "古宛城"],
  },
};

function getCityScene(city: string): CitySceneConfig {
  return (
    CITY_SCENES[city] ?? {
      city,
      accent: "#bf7448",
      accentSoft: "#e2bc8f",
      blossom: "#f1d0d9",
      water: "#92cad6",
      gateLabel: city,
      skyline: ["古城", "城门", "水岸"],
      heritage: ["城门楼", "桥影", "人文遗址"],
    }
  );
}

export default function CityPostcard({ city, variant = "card" }: CityPostcardProps) {
  const scene = getCityScene(city);
  const imageConfig = CITY_IMAGE_MAP[city];
  const imageSrc = imageConfig?.src;
  const imageStyle = imageConfig?.objectPosition
    ? { objectPosition: imageConfig.objectPosition }
    : undefined;

  if (variant === "banner") {
    if (imageSrc) {
      return (
        <article className="arch-city-banner" aria-label={`${scene.city} 城市横幅图片`}>
          <img
            className="arch-city-banner__image"
            src={imageSrc}
            alt={`${scene.city} 城市插画`}
            style={imageStyle}
          />
        </article>
      );
    }

    return (
      <article className="arch-city-banner" aria-label={`${scene.city} 城市横幅插画`}>
        <svg viewBox="0 0 760 220" className="arch-city-banner__svg" role="img" aria-label={`${scene.city} 城市插画横幅`}>
          <defs>
            <linearGradient id={`banner-sky-${scene.city}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#d8f2f9" />
              <stop offset="100%" stopColor="#f6fbfd" />
            </linearGradient>
            <linearGradient id={`banner-water-${scene.city}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={scene.water} />
              <stop offset="100%" stopColor="#72b8c8" />
            </linearGradient>
            <linearGradient id={`banner-roof-${scene.city}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={scene.accentSoft} />
              <stop offset="100%" stopColor={scene.accent} />
            </linearGradient>
          </defs>

          <rect width="760" height="220" rx="28" fill={`url(#banner-sky-${scene.city})`} />
          <rect y="154" width="760" height="66" fill={`url(#banner-water-${scene.city})`} />
          <path d="M0 150 C80 132, 144 134, 216 150 C294 168, 394 170, 488 152 C578 134, 664 136, 760 148 L760 176 L0 176 Z" fill="#c7e8cf" />

          <g opacity="0.18">
            <rect x="510" y="36" width="42" height="114" rx="8" fill="#83abc1" />
            <path d="M566 54 L608 26 L640 54 L640 150 L566 150 Z" fill="#83abc1" />
            <rect x="650" y="44" width="34" height="106" rx="6" fill="#83abc1" />
          </g>

          <g transform="translate(258 68)">
            <rect x="0" y="48" width="148" height="70" rx="8" fill="#f7f0e8" stroke="#cba98f" strokeWidth="2" />
            <path d="M-18 58 Q74 2 166 58 L148 58 Q74 22 0 58 Z" fill={`url(#banner-roof-${scene.city})`} stroke="#8a5a34" strokeWidth="2" />
            <rect x="18" y="72" width="18" height="34" rx="4" fill="#8f5d39" />
            <rect x="64" y="72" width="20" height="34" rx="4" fill="#8f5d39" />
            <rect x="110" y="72" width="18" height="34" rx="4" fill="#8f5d39" />
            <text x="74" y="42" textAnchor="middle" fontSize="20" fontWeight="700" fill="#7d4a27">
              {scene.gateLabel}
            </text>
          </g>

          <g transform="translate(114 120)">
            <path d="M0 30 Q44 -8 88 30" fill="none" stroke="#c79a8c" strokeWidth="10" strokeLinecap="round" />
            <path d="M10 30 Q44 10 78 30" fill="none" stroke="#ead2cb" strokeWidth="7" strokeLinecap="round" />
          </g>

          <g transform="translate(28 14)">
            <path d="M110 40 C138 0, 184 6, 214 44" fill="none" stroke="#a7d4c6" strokeWidth="10" strokeLinecap="round" />
            {[0, 1, 2].map((idx) => (
              <g key={idx} transform={`translate(${154 + idx * 40} ${38 - idx * 3})`}>
                <ellipse cx="0" cy="0" rx="16" ry="20" fill="#ffffff" stroke="#88a9b5" strokeWidth="2" />
                <ellipse cx="12" cy="-4" rx="14" ry="18" fill="#ffffff" stroke="#88a9b5" strokeWidth="2" />
                <circle cx="10" cy="7" r="4" fill="#f2c55b" />
              </g>
            ))}
          </g>

          <text x="88" y="64" fontSize="40" fill={scene.accent} fontWeight="800">
            {scene.city}
          </text>
          <text x="88" y="94" fontSize="14" fill="#7d6a5a">
            {scene.skyline.join(" · ")}
          </text>
        </svg>
      </article>
    );
  }

  if (imageSrc) {
    return (
      <article className="arch-city-card" aria-label={`${scene.city} 城市图片`}>
        <div className="arch-city-card__frame">
          <img
            className="arch-city-illustration arch-city-illustration--image"
            src={imageSrc}
            alt={`${scene.city} 城市插画`}
            style={imageStyle}
          />
        </div>
      </article>
    );
  }

  return (
    <article className="arch-city-card" aria-label={`${scene.city} 城市插画`}>
      <div className="arch-city-card__frame">
        <svg viewBox="0 0 380 480" className="arch-city-illustration" role="img" aria-label={`${scene.city} 手绘城市明信片`}>
          <defs>
            <linearGradient id={`sky-${scene.city}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#d8f1f8" />
              <stop offset="100%" stopColor="#eef9fb" />
            </linearGradient>
            <linearGradient id={`water-${scene.city}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={scene.water} />
              <stop offset="100%" stopColor="#75b7cb" />
            </linearGradient>
            <linearGradient id={`roof-${scene.city}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={scene.accentSoft} />
              <stop offset="100%" stopColor={scene.accent} />
            </linearGradient>
          </defs>

          <rect width="380" height="480" rx="28" fill="url(#sky-${scene.city})" />
          <rect x="0" y="328" width="380" height="152" fill="url(#water-${scene.city})" />
          <path d="M0 318 C48 305, 92 300, 132 314 C178 328, 230 330, 278 316 C322 304, 352 306, 380 314 L380 348 L0 348 Z" fill="#bfe4c7" />
          <path d="M0 340 C44 330, 82 332, 120 342 C166 354, 220 356, 276 344 C320 334, 352 338, 380 344 L380 368 L0 368 Z" fill="#8ed1a1" opacity="0.72" />

          <g opacity="0.18">
            <rect x="248" y="118" width="38" height="182" rx="6" fill="#7ea5bf" />
            <path d="M300 126 L330 104 L352 126 L352 300 L300 300 Z" fill="#7ea5bf" />
            <rect x="180" y="144" width="52" height="156" rx="6" fill="#7ea5bf" />
          </g>

          <path d="M34 268 Q78 232 118 268" fill="none" stroke="#c79a8c" strokeWidth="12" strokeLinecap="round" />
          <path d="M40 268 Q78 246 112 268" fill="none" stroke="#ead2cb" strokeWidth="8" strokeLinecap="round" />
          {Array.from({ length: 7 }).map((_, idx) => (
            <line key={idx} x1={44 + idx * 12} y1="262" x2={44 + idx * 12} y2="280" stroke="#ae8b82" strokeWidth="2" />
          ))}

          <g transform="translate(132 164)">
            <rect x="0" y="74" width="116" height="88" rx="8" fill="#f7f0e8" stroke="#cba98f" strokeWidth="2" />
            <path d="M-12 82 Q58 16 128 82 L112 82 Q58 40 4 82 Z" fill={`url(#roof-${scene.city})`} stroke="#8a5a34" strokeWidth="2" />
            <rect x="14" y="98" width="18" height="50" rx="4" fill="#8f5d39" />
            <rect x="48" y="98" width="20" height="50" rx="4" fill="#8f5d39" />
            <rect x="84" y="98" width="18" height="50" rx="4" fill="#8f5d39" />
            <text x="58" y="64" textAnchor="middle" fontSize="18" fontWeight="700" fill="#7d4a27">
              {scene.gateLabel}
            </text>
          </g>

          <g transform="translate(248 276)">
            <rect x="0" y="34" width="66" height="54" rx="6" fill="#f7f0e8" stroke="#ceb09b" strokeWidth="2" />
            <path d="M-10 40 Q33 -2 76 40 L62 40 Q33 16 4 40 Z" fill="#8f8a8d" stroke="#6f6662" strokeWidth="2" />
            <rect x="20" y="48" width="10" height="40" rx="2" fill="#8f8a8d" />
            <rect x="38" y="48" width="10" height="40" rx="2" fill="#8f8a8d" />
            <rect x="58" y="8" width="8" height="72" rx="2" fill="#d7c4a0" stroke="#8b7552" strokeWidth="2" />
          </g>

          <g transform="translate(26 44)">
            <ellipse cx="46" cy="30" rx="28" ry="18" fill="#f7fbff" />
            <ellipse cx="68" cy="36" rx="24" ry="15" fill="#f7fbff" />
          </g>

          <g transform="translate(18 22)">
            <path d="M70 40 C92 0, 128 8, 148 44" fill="none" stroke="#a7d4c6" strokeWidth="10" strokeLinecap="round" />
            <path d="M88 22 C112 8, 140 14, 154 38" fill="none" stroke="#7eb9a8" strokeWidth="8" strokeLinecap="round" />
            {[0, 1, 2].map((idx) => (
              <g key={idx} transform={`translate(${94 + idx * 34} ${32 + idx * 4})`}>
                <ellipse cx="0" cy="0" rx="14" ry="18" fill="#ffffff" stroke="#88a9b5" strokeWidth="2" />
                <ellipse cx="10" cy="-4" rx="12" ry="16" fill="#ffffff" stroke="#88a9b5" strokeWidth="2" />
                <circle cx="8" cy="6" r="4" fill="#f2c55b" />
              </g>
            ))}
          </g>

          {scene.heritage.map((item, idx) => (
            <text
              key={item}
              x="28"
              y={396 + idx * 26}
              fontSize="14"
              fill="#55686f"
              fontWeight="600"
            >
              {`• ${item}`}
            </text>
          ))}

          <text x="318" y="94" textAnchor="middle" fontSize="34" fill={scene.accent} fontWeight="800">
            {scene.city}
          </text>
          <text x="318" y="124" textAnchor="middle" fontSize="14" fill="#7d6a5a">
            {scene.skyline.join(" · ")}
          </text>
        </svg>
      </div>
    </article>
  );
}

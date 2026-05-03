
import { HERO_ROUTE, HENAN_VIEWBOX, toPath } from "../../utils/henanGeo";

type Props = {
  className?: string;
  mode?: "hero" | "watermark";
  showRoute?: boolean;
  showLabels?: boolean;
};

const path = toPath();

export default function HenanBackdrop({
  className = "",
  mode = "hero",
  showRoute = true,
  showLabels = true,
}: Props) {
  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${HENAN_VIEWBOX.width} ${HENAN_VIEWBOX.height}`}
        className={`henan-backdrop henan-backdrop--${mode}`}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`henan-fill-${mode}`} cx="48%" cy="42%" r="72%">
            <stop offset="0%" stopColor={mode === "hero" ? "#fbf4ea" : "#f7efe4"} />
            <stop offset="100%" stopColor={mode === "hero" ? "#f2e6d7" : "#f5ebde"} />
          </radialGradient>
        </defs>
        <path
          d={path}
          fill={`url(#henan-fill-${mode})`}
          stroke="#d0af94"
          strokeWidth={mode === "hero" ? 3 : 2.2}
          strokeLinejoin="round"
        />
        {showRoute && (
          <path
            d={`M ${HERO_ROUTE.map((p) => `${p.x},${p.y}`).join(" L ")}`}
            fill="none"
            stroke="#c48752"
            strokeWidth={mode === "hero" ? 8 : 5}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={mode === "hero" ? 0.82 : 0.25}
          />
        )}
        {HERO_ROUTE.map((point) => (
          <g key={point.name} opacity={mode === "hero" ? 1 : 0.28}>
            <circle cx={point.x} cy={point.y} r={mode === "hero" ? 18 : 11} fill="#ecd4bc" />
            <circle cx={point.x} cy={point.y} r={mode === "hero" ? 8.5 : 5.5} fill="#8f4721" />
            {showLabels && (
              <text
                x={point.x}
                y={point.y - (mode === "hero" ? 26 : 16)}
                textAnchor="middle"
                fontSize={mode === "hero" ? 18 : 12}
                fontWeight="700"
                fill="#6e5c49"
              >
                {point.name}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

import { useMemo } from "react";
import "./StoryNav.css";

interface StoryNavProps {
  nav?: Record<string, string>;
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function StoryNav({ nav, activePage, onNavigate }: StoryNavProps) {
  const navItems = useMemo(
    () => [
      { label: nav?.intro ?? "卷首", target: "hero" },
      { label: nav?.origin ?? "中原何以为中原", target: "origin" },
      { label: nav?.dynasty ?? "朝代卷轴", target: "dynasty" },
      { label: nav?.map ?? "山河分布", target: "map" },
      { label: nav?.theater ?? "成就剧场", target: "theater" },
      { label: nav?.trajectory ?? "文明星轨", target: "trajectory" },
      { label: nav?.methodology ?? "研究方法", target: "methodology" },
      { label: nav?.outro ?? "卷尾", target: "outro" },
    ],
    [nav],
  );

  return (
    <nav className="story-nav is-scrolled" aria-label="作品页面导航">
      {navItems.map((item) => (
        <button
          key={item.target}
          type="button"
          className={`story-nav__button ${activePage === item.target ? "is-active" : ""}`}
          onClick={() => onNavigate(item.target)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

import "./SectionHeader.css";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  desc?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  desc,
}: SectionHeaderProps) {
  return (
    <header className="section-header">
      <p className="section-header__subtitle">{subtitle}</p>
      <h2 className="section-header__title">{title}</h2>
      {desc ? <p className="section-header__desc">{desc}</p> : null}
    </header>
  );
}

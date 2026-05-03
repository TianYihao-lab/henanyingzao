import type { PropsWithChildren } from "react";
import { useReveal } from "../../hooks/useReveal";
import "./StorySection.css";

interface StorySectionProps extends PropsWithChildren {
  id: string;
  className?: string;
}

export default function StorySection({
  id,
  className = "",
  children,
}: StorySectionProps) {
  const { ref, revealed } = useReveal<HTMLElement>();

  return (
    <section
      id={id}
      ref={ref}
      className={`story-section ${className} ${revealed ? "is-revealed" : ""}`.trim()}
      data-section-id={id}
      style={{ containIntrinsicSize: "1100px" }}
    >
      <div className="story-section__transition" aria-hidden="true">
        <span className="story-section__wash story-section__wash--left" />
        <span className="story-section__wash story-section__wash--right" />
        <span className="story-section__inkline" />
      </div>
      <div className="story-section__inner">{children}</div>
    </section>
  );
}

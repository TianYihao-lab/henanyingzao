export interface SiteCopy {
  title: string;
  subtitle: string;
  enTitle: string;
  description: string;
}

export interface HeroCopy {
  title: string;
  enTitle: string;
  subtitle: string;
  lead1: string;
  lead2: string;
  cta: string;
  tip: string;
  bg: {
    seal: string;
    scroll: string;
    arch: string;
  };
}

export interface CardItem {
  title: string;
  desc: string;
}

export interface OriginCopy {
  title: string;
  subtitle: string;
  desc: string;
  cards: CardItem[];
  legend: Record<string, string>;
  footer: string;
  tooltip: {
    title: string;
    desc: string;
  };
}

export interface DynastyCopy {
  title: string;
  subtitle: string;
  desc: string;
  sealNav: {
    label: string;
    default: string;
    active: string;
  };
  field: Record<string, string>;
  peak: {
    title: string;
    desc: string;
    tag: string;
  };
  current: {
    template: string;
  };
  footer: string;
  tooltip: Record<string, string>;
}

export interface MapCopy {
  title: string;
  subtitle: string;
  desc: string;
  filter: Record<string, string>;
  card: Record<string, string>;
  insights: CardItem[];
  legend: Record<string, string>;
  footer: string;
  tooltip: Record<string, string>;
}

export interface TheaterCopy {
  title: string;
  subtitle: string;
  desc: string;
  selector: Record<string, string>;
  visual: Record<string, string>;
  metric: Record<string, string>;
  metricDesc: Record<string, string>;
  compare: Record<string, string>;
  highlight: string;
  tooltip: Record<string, string>;
}

export interface TrajectoryCopy {
  title: string;
  subtitle: string;
  desc: string;
  visual: {
    title: string;
  };
  slider: {
    label: string;
  };
  play: string;
  pause: string;
  reset: string;
  current: {
    template: string;
  };
  legend: Record<string, string>;
  conclusion: {
    title: string;
    desc: string;
  };
  footer: string;
  tooltip: Record<string, string>;
}

export interface OutroCopy {
  title: string;
  subtitle: string;
  findings: CardItem[];
  innovation: {
    title: string;
    items: string[];
  };
  desc1: string;
  desc2: string;
  desc3: string;
  cta: string;
  backTop: string;
}

export interface MethodologyCopy {
  title: string;
  subtitle: string;
  desc: string;
  dataSources: {
    title: string;
    sources: string[];
  };
  methodology: {
    title: string;
    steps: string[];
  };
  aciDefinition: {
    title: string;
    desc: string;
    explanation: string;
  };
  limitations: {
    title: string;
    points: string[];
  };
  academicValue: {
    title: string;
    desc: string;
  };
  footer: string;
}

export interface AppCopy {
  site: SiteCopy;
  nav: Record<string, string>;
  btn: Record<string, string>;
  hint: Record<string, string>;
  hero: HeroCopy;
  origin: OriginCopy;
  dynasty: DynastyCopy;
  map: MapCopy;
  theater: TheaterCopy;
  trajectory: TrajectoryCopy;
  outro: OutroCopy;
  methodology: MethodologyCopy;
  field: Record<string, string>;
  state: Record<string, string>;
}
export type NavigationItem = {
  href: string;
  label: string;
  description?: string;
};

export type MetricCard = {
  label: string;
  value: string;
  detail: string;
};

export type FeaturePillar = {
  title: string;
  description: string;
  bullets: string[];
};

export type WorkflowStep = {
  title: string;
  description: string;
};

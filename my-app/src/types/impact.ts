export interface ImpactMetric {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  description?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

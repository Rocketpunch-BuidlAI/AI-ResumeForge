export const types = ['Claude'] as const;

export type ModelType = (typeof types)[number];

export interface Model<Type = string> {
  id: string;
  name: string;
  description: string;
  strengths?: string;
  type: Type;
}

export const models: Model<ModelType>[] = [
  {
    id: 'c305f976-8e38-42b1-9fb7-d21b2e34f0da',
    name: 'claude-3-7-sonnet-20250219',
    description:
      "Claude 3 Sonnet is Anthropic's mid-sized model that offers excellent performance and efficiency. It can handle complex tasks and generate accurate responses.",
    type: 'Claude',
    strengths:
      'Complex reasoning, creative writing, code generation, document analysis, multilingual support',
  },
];

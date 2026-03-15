import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CampaignInput {
  product: string;
  description: string;
  targetAudience: string;
  objective: 'awareness' | 'conversion' | 'engagement' | 'traffic';
  platform: 'instagram' | 'facebook' | 'google_ads' | 'tiktok' | 'linkedin';
  tone?: 'formal' | 'casual' | 'urgent' | 'inspirational';
}

export interface CampaignOutput {
  headline: string;
  bodyText: string;
  cta: string;
  hashtags: string[];
  imagePrompt: string;
}

export async function generateCampaignCopy(input: CampaignInput): Promise<CampaignOutput> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em marketing digital e copywriting.
Gere copies persuasivos e criativos para campanhas de anúncios.
Sempre responda em JSON com os campos: headline, bodyText, cta, hashtags (array de strings), imagePrompt.`,
      },
      {
        role: 'user',
        content: `Crie uma copy para campanha com os seguintes dados:

- Produto/Serviço: ${input.product}
- Descrição: ${input.description}
- Público-alvo: ${input.targetAudience}
- Objetivo: ${input.objective}
- Plataforma: ${input.platform}
- Tom: ${input.tone ?? 'casual'}`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('Resposta inválida da IA');

  return JSON.parse(text) as CampaignOutput;
}

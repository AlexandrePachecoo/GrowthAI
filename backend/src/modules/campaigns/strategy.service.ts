import OpenAI from 'openai';
import { pool } from '../../db';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface StrategyInput {
  campaignId: string;
  userId: string;
  totalBudget: number; // em reais
  currency?: string;
}

export interface PlatformStrategy {
  platform: string;
  budget: number;
  percentage: number;
  rationale: string;
  expectedResults: string;
  recommendedObjective: string;
}

export interface StrategyOutput {
  summary: string;
  platforms: PlatformStrategy[];
  generalTips: string[];
  warning?: string;
}

export async function generateStrategy(input: StrategyInput): Promise<StrategyOutput> {
  const { rows } = await pool.query(
    `SELECT name, product, platforms, copies FROM campaigns WHERE id = $1 AND user_id = $2`,
    [input.campaignId, input.userId]
  );

  if (!rows[0]) throw new Error('Campanha não encontrada');

  const campaign = rows[0];
  const copies = campaign.copies as Record<string, any>;

  // Montar contexto da campanha para a IA
  const platformList = campaign.platforms.join(', ');
  const copyContext = Object.entries(copies)
    .map(([plat, copy]: [string, any]) =>
      `[${plat}] Headline: "${copy.headline}" | CTA: "${copy.cta}"`
    )
    .join('\n');

  const currency = input.currency ?? 'BRL';
  const budgetFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(input.totalBudget);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Você é um especialista sênior em mídia paga (Meta Ads e Google Ads) com profundo conhecimento em alocação de orçamento e estratégia de canais.

Sua tarefa é analisar os dados de uma campanha e recomendar como distribuir o orçamento entre Meta Ads (Facebook/Instagram) e Google Ads de forma estratégica.

Responda SEMPRE em JSON com esta estrutura exata:
{
  "summary": "resumo executivo da estratégia em 2-3 frases",
  "platforms": [
    {
      "platform": "Meta Ads",
      "budget": 0,
      "percentage": 0,
      "rationale": "justificativa da alocação",
      "expectedResults": "resultados esperados com esse orçamento",
      "recommendedObjective": "objetivo recomendado na plataforma"
    },
    {
      "platform": "Google Ads",
      "budget": 0,
      "percentage": 0,
      "rationale": "justificativa da alocação",
      "expectedResults": "resultados esperados com esse orçamento",
      "recommendedObjective": "objetivo recomendado na plataforma"
    }
  ],
  "generalTips": ["dica 1", "dica 2", "dica 3"],
  "warning": "aviso caso o orçamento seja muito baixo ou haja algo importante (opcional, null se não houver)"
}

Considere:
- Orçamentos abaixo de R$30/dia limitam muito os resultados — avise o usuário
- Meta é melhor para awareness, engajamento e nichos visuais (moda, beleza, alimentação, lifestyle)
- Google é melhor para intenção de compra, serviços locais, B2B e produtos com demanda ativa
- Para nichos B2C de impulso: favor Meta
- Para nichos com pesquisa ativa (advogado, dentista, software, curso): favor Google
- Orçamentos menores devem ser concentrados em uma plataforma`,
      },
      {
        role: 'user',
        content: `Analise a campanha abaixo e distribua o orçamento:

Produto/Serviço: ${campaign.product}
Plataformas da campanha: ${platformList}
Orçamento total disponível: ${budgetFormatted}

Copies geradas:
${copyContext}`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('Resposta inválida da IA');

  return JSON.parse(text) as StrategyOutput;
}

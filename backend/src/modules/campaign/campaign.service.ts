import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CampaignInput {
  product: string;
  description: string;
  targetAudience: string;
  objective: 'awareness' | 'conversion' | 'engagement' | 'traffic';
  platforms: string[];
  tone?: 'formal' | 'casual' | 'urgent' | 'inspirational';
}

export interface CampaignOutput {
  headline: string;
  bodyText: string;
  cta: string;
  hashtags: string[];
  imagePrompt: string;
}

async function generateForPlatform(input: CampaignInput, platform: string): Promise<CampaignOutput> {
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Você é um especialista em marketing digital e copywriting.
Gere copies persuasivos e criativos para campanhas de anúncios.

REGRAS OBRIGATÓRIAS:
- Use APENAS as informações fornecidas pelo usuário. Nunca invente benefícios, prêmios, promoções ou funcionalidades que não foram mencionados.
- Se uma informação não foi fornecida, não a inclua na copy.
- Seja criativo na forma de escrever, mas fiel aos fatos fornecidos.

REGRAS PARA O CAMPO imagePrompt:
O imagePrompt descreve o CONTEXTO VISUAL E O NICHO do produto — será usado por um designer de IA para criar o criativo. Siga estas diretrizes obrigatórias:
- Identifique o nicho do produto (ex: fitness, fintech, moda, alimentação, SaaS, beleza, educação, viagem, games, saúde, imóveis)
- OBRIGATÓRIO: indique 2 a 3 cores VIBRANTES e ESPECÍFICAS que representam esse nicho (ex: "electric orange and deep charcoal" para fitness, "neon purple and cyan" para games, "rose gold and blush pink" para beleza)
- NUNCA sugira cores neutras como cinza, bege, off-white, navy genérico ou preto simples como cores principais
- NUNCA inclua pessoas, rostos, animais ou fotografias
- Descreva elementos visuais do nicho: texturas, formas, objetos abstratos, padrões
- O prompt deve ser em inglês, com 2 a 3 linhas
- Exemplo fitness: "Electric orange and neon green color scheme. Bold geometric shapes, dynamic diagonal lines, athletic energy"
- Exemplo beauty: "Rose gold and hot pink palette. Soft fluid organic shapes, glossy reflections, luxurious feel"

Sempre responda em JSON com os campos: headline, bodyText, cta, hashtags (array de strings), imagePrompt.`,
      },
      {
        role: 'user',
        content: `Crie uma copy para campanha com os seguintes dados:

- Produto/Serviço: ${input.product}
- Descrição: ${input.description}
- Público-alvo: ${input.targetAudience}
- Objetivo: ${input.objective}
- Plataforma: ${platform}
- Tom: ${input.tone ?? 'casual'}`,
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('Resposta inválida da IA');

  return JSON.parse(text) as CampaignOutput;
}

export async function generateCampaignCopy(input: CampaignInput): Promise<Record<string, CampaignOutput>> {
  const entries = await Promise.all(
    input.platforms.map(async (platform) => {
      const output = await generateForPlatform(input, platform);
      return [platform, output] as [string, CampaignOutput];
    })
  );
  return Object.fromEntries(entries);
}

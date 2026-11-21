import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = 'gemini-4-hydrogen';

type ListingLanguage = 'English' | 'Urdu' | 'Roman Urdu';

const VALID_LANGUAGES = new Set<ListingLanguage>(['English', 'Urdu', 'Roman Urdu']);

const LISTING_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    productTitle: {
      type: Type.STRING,
      description: 'SEO-friendly product title tailored for online shoppers in Pakistan.',
    },
    productDescription: {
      type: Type.STRING,
      description: 'Short, warm, and persuasive product description (2 to 4 sentences).',
    },
    keySellingPoints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Exactly 5 concise, high-converting key selling points.',
    },
    socialPost: {
      type: Type.OBJECT,
      properties: {
        caption: {
          type: Type.STRING,
          description: 'Engaging Instagram/Facebook caption with tasteful emojis and a clear call to action.',
        },
        hashtags: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Exactly 8 relevant hashtags starting with # for online buyers in Pakistan.',
        },
      },
      required: ['caption', 'hashtags'],
    },
    whatsappMessage: {
      type: Type.STRING,
      description: 'Ready-to-send polite, friendly WhatsApp message to send directly to a customer.',
    },
    photoFeedback: {
      type: Type.OBJECT,
      properties: {
        lighting: {
          type: Type.STRING,
          description: '1 quick, actionable tip to improve lighting based on this specific photo.',
        },
        background: {
          type: Type.STRING,
          description: '1 quick, actionable tip to improve background or styling based on this specific photo.',
        },
        angle: {
          type: Type.STRING,
          description: '1 quick, actionable tip to improve camera angle or framing based on this specific photo.',
        },
      },
      required: ['lighting', 'background', 'angle'],
    },
  },
  required: [
    'productTitle',
    'productDescription',
    'keySellingPoints',
    'socialPost',
    'whatsappMessage',
    'photoFeedback',
  ],
};

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function buildLanguageGuidance(language: ListingLanguage): string {
  switch (language) {
    case 'Urdu':
      return 'Write ALL output fields in natural, polite, everyday commercial Urdu script (اردو). Keep sentences smooth and easy for Pakistani shoppers to read. Hashtags may be in Urdu or common Pakistani shopping English tags starting with #.';
    case 'Roman Urdu':
      return 'Write ALL output fields in natural, friendly everyday Pakistani Roman Urdu (the way Pakistani sellers and customers chat on WhatsApp and Instagram, e.g., "Assalam-o-Alaikum", "bohat zabardast quality", "poore Pakistan mein delivery available").';
    case 'English':
    default:
      return 'Write ALL output fields in clear, warm, persuasive English tailored for online shoppers in Pakistan (use Rs. for prices if mentioned).';
  }
}

function normalizeListing(raw: Record<string, unknown>) {
  const rawPoints = Array.isArray(raw.keySellingPoints) ? raw.keySellingPoints : [];
  const keySellingPoints = rawPoints
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, 5);

  const socialObj = (raw.socialPost && typeof raw.socialPost === 'object' ? raw.socialPost : {}) as Record<
    string,
    unknown
  >;
  const rawTags = Array.isArray(socialObj.hashtags) ? socialObj.hashtags : [];
  const hashtags = rawTags
    .map((tag) => String(tag ?? '').trim())
    .filter(Boolean)
    .slice(0, 8)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`));

  const feedbackObj = (
    raw.photoFeedback && typeof raw.photoFeedback === 'object' ? raw.photoFeedback : {}
  ) as Record<string, unknown>;

  return {
    productTitle: String(raw.productTitle ?? '').trim(),
    productDescription: String(raw.productDescription ?? '').trim(),
    keySellingPoints,
    socialPost: {
      caption: String(socialObj.caption ?? '').trim(),
      hashtags,
    },
    whatsappMessage: String(raw.whatsappMessage ?? '').trim(),
    photoFeedback: {
      lighting: String(feedbackObj.lighting ?? '').trim(),
      background: String(feedbackObj.background ?? '').trim(),
      angle: String(feedbackObj.angle ?? '').trim(),
    },
  };
}

async function generateListingWithModel(
  ai: GoogleGenAI,
  model: string,
  params: {
    imageBase64: string;
    mimeType: string;
    notes: string;
    language: ListingLanguage;
    isRegenerate: boolean;
  }
) {
  const systemInstruction = [
    'You are Dukaan Saathi, a practical e-commerce listing assistant and product photography coach for small shopkeepers and home-business owners in Pakistan.',
    buildLanguageGuidance(params.language),
    'Inspect the uploaded product photo carefully (color, material, craftsmanship, texture, packaging, lighting, background, and camera angle) and combine those visual details with any seller notes provided.',
    'Never invent false specifications that contradict the photo (for example wrong color, unverified brand names, or fake certifications). If price or delivery info was not provided by the seller, keep the WhatsApp message welcoming without inventing a fake price.',
    'Strictly return exactly 5 items in keySellingPoints and exactly 8 hashtags starting with # in socialPost.hashtags, plus specific, encouraging tips in photoFeedback for lighting, background, and angle.',
  ].join(' ');

  const userPrompt = [
    `Target Language: ${params.language}`,
    params.notes
      ? `Seller Notes: "${params.notes}"`
      : 'Seller Notes: None provided — rely carefully on what is visible in the product photo.',
    params.isRegenerate
      ? `Create a fresh creative variation (variation seed ${Math.floor(Math.random() * 100000)}) with different phrasing and fresh selling angles compared to a standard first draft.`
      : '',
    'Return the complete structured JSON listing now with exactly 5 keySellingPoints and 8 hashtags.',
  ]
    .filter(Boolean)
    .join('\n');

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: params.mimeType,
            data: params.imageBase64,
          },
        },
        { text: userPrompt },
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: LISTING_RESPONSE_SCHEMA,
      thinkingConfig: {
        thinkingLevel: model === 'gemini-4-hydrogen' ? ThinkingLevel.LOW : ThinkingLevel.MINIMAL,
      },
      abortSignal: AbortSignal.timeout(25000),
      ...(params.isRegenerate ? { seed: Math.floor(Math.random() * 1_000_000) } : {}),
    },
  });

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('EMPTY_RESPONSE');
  }

  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  const parsed = JSON.parse(cleaned) as Record<string, unknown>;
  return normalizeListing(parsed);
}

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.post('/api/generate', async (req, res) => {
    const ai = getAiClient();
    if (!ai) {
      res.status(500).json({
        error: 'Gemini API key is not configured on the server yet. Please check your environment secrets.',
      });
      return;
    }

    const body = req.body as {
      imageBase64?: unknown;
      mimeType?: unknown;
      notes?: unknown;
      language?: unknown;
      isRegenerate?: unknown;
    };

    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64.trim() : '';
    const mimeType = typeof body.mimeType === 'string' && body.mimeType.startsWith('image/')
      ? body.mimeType
      : 'image/jpeg';
    const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '';
    const language = (
      typeof body.language === 'string' && VALID_LANGUAGES.has(body.language as ListingLanguage)
        ? body.language
        : 'English'
    ) as ListingLanguage;
    const isRegenerate = Boolean(body.isRegenerate);

    if (!imageBase64) {
      res.status(400).json({
        error: 'Please upload or take a product photo first so Dukaan Saathi can inspect your item.',
      });
      return;
    }

    try {
      const listing = await generateListingWithModel(ai, PRIMARY_MODEL, {
        imageBase64,
        mimeType,
        notes,
        language,
        isRegenerate,
      });
      res.json({ listing });
    } catch (primaryErr: unknown) {
      const msg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      const isTransient =
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('aborted') ||
        msg.includes('AbortError') ||
        msg.includes('timeout') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('RESOURCE_EXHAUSTED');

      if (isTransient) {
        try {
          const fallbackListing = await generateListingWithModel(ai, FALLBACK_MODEL, {
            imageBase64,
            mimeType,
            notes,
            language,
            isRegenerate,
          });
          res.json({ listing: fallbackListing });
          return;
        } catch (fallbackErr: unknown) {
          console.error('Fallback Gemini error:', fallbackErr);
        }
      } else {
        console.error('Primary Gemini error:', primaryErr);
      }

      if (msg.includes('API_KEY') || msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
        res.status(403).json({
          error: 'The server Gemini API key appears invalid or lacks permission. Please verify GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
        res.status(429).json({
          error: 'Dukaan Saathi is receiving many requests right now. Please wait a few seconds and try again.',
        });
        return;
      }
      if (msg.includes('SAFETY')) {
        res.status(400).json({
          error: 'This photo could not be processed by safety filters. Please try another clear photo of your product.',
        });
        return;
      }

      res.status(502).json({
        error: 'Could not generate the listing right now. Please check the photo and try again.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Dukaan Saathi server listening on http://localhost:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

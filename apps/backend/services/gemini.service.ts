import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const model = 'gemini-2.5-flash-lite';

export interface CharacterIdentificationResult {
  characterName: string;
  characterFacts: {
    gender: string | null;
    fictional: boolean | null;
    occupation: string | null;
    universe: string | null;
  };
  confidence: number;
}

export const identifyCharacter = async (
  imageBuffer: Buffer,
  mimeType: string
): Promise<CharacterIdentificationResult> => {
  const imageBase64 = imageBuffer.toString('base64');

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
      {
        text: `
Identify the main person or fictional character shown in this image.

This image is being used for a "Who Am I?" guessing game.

Return:
- The most likely character/person name.
- Basic facts useful for understanding the character.
- A confidence score between 0 and 1.

If you cannot reliably identify the character, say so instead of inventing an identity.

Do not explain your reasoning.
        `,
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          characterName: {
            type: 'string',
          },
          characterFacts: {
            type: 'object',
            properties: {
              gender: {
                type: ['string', 'null'],
              },
              fictional: {
                type: ['boolean', 'null'],
              },
              occupation: {
                type: ['string', 'null'],
              },
              universe: {
                type: ['string', 'null'],
              },
            },
            required: [
              'gender',
              'fictional',
              'occupation',
              'universe',
            ],
          },
          confidence: {
            type: 'number',
          },
        },
        required: [
          'characterName',
          'characterFacts',
          'confidence',
        ],
      },
    },
  });

  if (!response.text) {
    throw new Error('Gemini returned an empty response');
  }

  return JSON.parse(response.text) as CharacterIdentificationResult;
};
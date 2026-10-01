import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const model = 'gemini-3.5-flash-lite';

export interface CharacterIdentificationResult {
  validForGame: boolean;
  characterName: string;
  characterFacts: {
    gender: string | null;
    fictional: boolean | null;
    occupation: string | null;
    universe: string | null;
    aliases: string[];
  };
  confidence: number;
  reason: string | null;
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
You are the image identification system for a "Who Am I?" guessing game.

Analyze the uploaded image and determine whether it contains a recognizable person or fictional character.

VALID IMAGE:
- A recognizable real person.
- A recognizable fictional character.
- A recognizable anime character.
- A recognizable movie or TV character.
- A recognizable comic or superhero character.
- A recognizable video game character.
- A recognizable famous public figure.

INVALID IMAGE:
- Buildings.
- Temples.
- Places.
- Landscapes.
- Food.
- Random animals.
- Objects.
- Vehicles.
- Logos.
- Products.
- Scenery.
- Architecture.
- Random locations.
- Generic images without a recognizable person or fictional character.
- An unidentifiable person.
- An unidentifiable fictional character.

IMPORTANT RULES:

1. If the image contains a recognizable real person, identify that person.

2. If the image contains a recognizable fictional character, identify the fictional character.

3. If an actor is portraying a fictional character, identify the fictional character when the character is recognizable rather than simply identifying the actor.

4. NEVER invent an identity.

5. NEVER use generic descriptions such as:
   - "Unknown Cat"
   - "Cat"
   - "Dog"
   - "Man"
   - "Woman"
   - "Person"
   - "Unknown Person"
   as a characterName.

6. If the image does not contain a recognizable person or fictional character:
   - validForGame must be false.
   - characterName must be "Unknown".
   - confidence must be 0.
   - gender must be null.
   - fictional must be null.
   - occupation must be null.
   - universe must be null.
   - reason must briefly explain why the image is invalid.

7. If the image contains a person or fictional character but you cannot reliably identify them:
   - validForGame must be false.
   - characterName must be "Unknown".
   - confidence must be 0.
   - reason must explain that the identity cannot be reliably determined.

8. If the identity is recognizable:
   - validForGame must be true.
   - characterName must contain the commonly known name.
   - provide the available character facts.
   - confidence must represent your actual confidence in the identification.
   - reason should be null.

9. Do not artificially increase confidence.

10. confidence must always be between 0 and 1.

11. Return ONLY valid JSON.

12. Do not explain your reasoning.

For characterFacts:

- gender: gender of the identified person or character when reasonably known, otherwise null.
- fictional: true for fictional characters, false for recognizable real people, otherwise null.
- occupation: known occupation or role, otherwise null.
- universe: fictional universe/franchise for fictional characters, "Real Life" for recognizable real people, otherwise null.
- aliases: commonly used, recognizable alternate names or nicknames that clearly refer to this same identity (for example, "Messi" and "Leo Messi" for Lionel Messi). Return an empty array when none are reliable. Do not include broad categories or ambiguous names.

Return exactly this structure:

{
  "validForGame": boolean,
  "characterName": string,
  "characterFacts": {
    "gender": string | null,
    "fictional": boolean | null,
    "occupation": string | null,
    "universe": string | null,
    "aliases": string[]
  },
  "confidence": number,
  "reason": string | null
}
        `,
      },
    ],

    config: {
      responseMimeType: 'application/json',

      responseSchema: {
        type: 'object',

        properties: {
          validForGame: {
            type: 'boolean',
          },

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
              aliases: {
                type: 'array',
                items: { type: 'string' },
              },
            },

            required: [
              'gender',
              'fictional',
              'occupation',
              'universe',
              'aliases',
            ],
          },

          confidence: {
            type: 'number',
          },

          reason: {
            type: ['string', 'null'],
          },
        },

        required: [
          'validForGame',
          'characterName',
          'characterFacts',
          'confidence',
          'reason',
        ],
      },
    },
  });

  if (!response.text) {
    throw new Error('Gemini returned an empty response');
  }

  try {
    const result =
      JSON.parse(response.text) as CharacterIdentificationResult;

    // Basic safety validation.
    if (
      typeof result.validForGame !== 'boolean' ||
      typeof result.characterName !== 'string' ||
      typeof result.confidence !== 'number'
    ) {
      throw new Error('Gemini returned an invalid character response');
    }

    if (!Array.isArray(result.characterFacts?.aliases)) {
      result.characterFacts = {
        ...result.characterFacts,
        aliases: [],
      };
    } else {
      result.characterFacts.aliases = result.characterFacts.aliases
        .filter((alias): alias is string => typeof alias === 'string')
        .map((alias) => alias.trim())
        .filter(Boolean)
        .slice(0, 12);
    }

    // Keep confidence within the expected range.
    result.confidence = Math.max(
      0,
      Math.min(1, result.confidence)
    );

    // Make sure invalid images cannot accidentally become characters.
    if (!result.validForGame) {
      result.characterName = 'Unknown';
      result.confidence = 0;

      result.characterFacts = {
        gender: null,
        fictional: null,
        occupation: null,
        universe: null,
        aliases: [],
      };
    }

    return result;
  } catch (error) {
    console.error('Failed to parse Gemini response:', response.text);
    throw new Error('Gemini returned an invalid response');
  }
};

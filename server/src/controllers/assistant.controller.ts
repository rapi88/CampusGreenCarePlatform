import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { BadRequestError } from '../utils/errors';

type AssistantReply = {
  answer: string;
  topic: string;
};

type CampusWeather = {
  precipitationProbability: number;
  precipitation: number;
  temperature: number;
  dayLabel: 'Bugün' | 'Yarın';
};

const CAMPUS_LOCATION = { latitude: 40.807147, longitude: 29.35769 };

const knowledgeBase: Array<{
  keywords: string[];
  topic: string;
  answer: string;
}> = [
  {
    keywords: ['selam', 'merhaba', 'hey', 'nasılsın', 'nasilsin'],
    topic: 'Bitki Asistanı',
    answer:
      'Merhaba! 🌿 Ağaçların sulanması, budanması, dikimi, gübrelenmesi ve toprak koşulları hakkında sorularını yanıtlayabilirim.',
  },
  {
    keywords: ['meşe', 'mese', 'oak'],
    topic: 'Meşe ağaçları',
    answer:
      'Meşe ağaçları kökleri yerleşene kadar, genellikle ilk iki yıl yaz aylarında haftada 1-2 kez derinlemesine sulanmalıdır. Toprak yüzeyi kuruduğunda sulayın; su birikintisi oluşmamasına dikkat edin. Yağışlı havalarda sulama aralığını uzatabilirsiniz.',
  },
  {
    keywords: ['çınar', 'cinar', 'plane'],
    topic: 'Çınar ağaçları',
    answer:
      'Çınar ağaçları kurak dönemlerde haftada yaklaşık bir kez, toprağı 20-30 cm derinliğe kadar nemlendirecek şekilde sulanabilir. Yeni dikilen fidanlar daha sık kontrol edilmelidir.',
  },
  {
    keywords: ['çam', 'cam', 'pine'],
    topic: 'Çam ağaçları',
    answer:
      'Çam ağaçlarının bakımı genellikle kolaydır. İyi drene olan, güneş alan bir yerde yetişirler; yerleşmiş ağaçları yalnızca uzun süren kuraklıklarda sulamak çoğunlukla yeterlidir. Yeni dikilen fidanları ilk iki yıl toprak kurudukça derinlemesine sulayın ve gövde çevresinde su biriktirmeyin.',
  },
  {
    keywords: ['sulama', 'sulanır', 'sulanir', 'su verme'],
    topic: 'Sulama',
    answer:
      'Sulama sıklığı ağacın türüne, yaşına, toprağa ve hava durumuna bağlıdır. En iyi kontrol, toprağın 5-10 cm altını kontrol etmektir: kuruysa yavaşça ve derin sulayın, nemliyse bekleyin.',
  },
  {
    keywords: ['budama', 'budanır', 'budanir'],
    topic: 'Budama',
    answer:
      'Ağaçlar çoğunlukla kış sonunda veya erken ilkbaharda, aktif büyüme başlamadan budanır. Kuru, kırık ve hastalıklı dalları temizleyin; büyük dallar için uzman desteği alın.',
  },
  {
    keywords: ['gübre', 'gubre', 'gübreleme', 'gubreleme'],
    topic: 'Gübreleme',
    answer:
      'Toprak analizi yapılmadan yoğun gübre kullanmayın. Sağlıklı ağaçlarda ilkbaharda kompost gibi organik madde kullanmak genellikle yeterlidir. Gübreyi gövdeye değdirmeden, taç izdüşümüne uygulayın.',
  },
  {
    keywords: ['ph', 'p h', 'asitlik', 'alkalilik', 'alkali', 'toprak asidi'],
    topic: 'Toprak pH değeri',
    answer:
      'Toprak pH değeri, ağacın besinleri alabilmesini ve kök gelişimini doğrudan etkiler. Birçok ağaç hafif asidik ile nötr arası toprakta, yaklaşık pH 6-7 aralığında iyi gelişir. Çok asidik veya alkali topraklarda demir ve fosfor gibi besinlerin alımı zorlaşabilir; değişiklik yapmadan önce toprak analizi yaptırın.',
  },
];

const normalize = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const getKnowledgeBaseReply = (question: string): AssistantReply => {
  const normalizedQuestion = normalize(question);
  const match = knowledgeBase.find((entry) =>
    entry.keywords.some((keyword) => normalizedQuestion.includes(normalize(keyword))),
  );

  return match
    ? { answer: match.answer, topic: match.topic }
    : {
        topic: 'Genel bitki bakımı',
        answer:
          'Bu konuda henüz kayıtlı bir yanıtım yok. Ağaç türü, sulama, budama veya gübreleme hakkında daha net bir soru sorabilirsiniz.',
      };
};

const isWateringQuestion = (question: string) => {
  const normalizedQuestion = normalize(question);
  return ['sulama', 'sula', 'sulamali', 'sulanmali', 'su vereyim', 'su vermeli'].some((keyword) =>
    normalizedQuestion.includes(normalize(keyword)),
  );
};

const isWeatherQuestion = (question: string) => {
  const normalizedQuestion = normalize(question);
  return ['yagis', 'yagmur', 'hava durumu', 'hava nasil', 'bugun hava', 'sicaklik', 'ruzgar', 'nem orani'].some((keyword) =>
    normalizedQuestion.includes(normalize(keyword)),
  );
};

const asksTomorrow = (question: string) => normalize(question).includes('yarin');

async function getCampusWeather(dayOffset: number): Promise<CampusWeather> {
  const params = new URLSearchParams({
    latitude: String(CAMPUS_LOCATION.latitude),
    longitude: String(CAMPUS_LOCATION.longitude),
    current: 'temperature_2m,precipitation',
    daily: 'precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '2',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Weather request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    current?: { temperature_2m?: number; precipitation?: number };
    daily?: { precipitation_probability_max?: number[] };
  };
  const precipitationProbability = data.daily?.precipitation_probability_max?.[dayOffset];
  const temperature = data.current?.temperature_2m;
  const precipitation = data.current?.precipitation;

  if (
    typeof precipitationProbability !== 'number' ||
    typeof temperature !== 'number' ||
    typeof precipitation !== 'number'
  ) {
    throw new Error('Weather response is missing required fields');
  }

  return {
    precipitationProbability,
    precipitation,
    temperature,
    dayLabel: dayOffset === 1 ? 'Yarın' : 'Bugün',
  };
}

const getWateringReply = (weather: CampusWeather): AssistantReply => {
  const { precipitationProbability, precipitation, temperature, dayLabel } = weather;

  if (precipitationProbability >= 70) {
    return {
      topic: `${dayLabel} sulama önerisi`,
      answer: `${dayLabel} ağacı sulamana gerek yok. Yağış olasılığı %${precipitationProbability}; yağmur toprağı doğal olarak nemlendirebilir. Sıcaklık yaklaşık ${Math.round(temperature)}°C. Yağmur gerçekleşmezse toprağın nemini kontrol et.`,
    };
  }

  if (precipitationProbability >= 40) {
    return {
      topic: `${dayLabel} sulama önerisi`,
      answer: `${dayLabel} sulamayı hemen yapmadan önce toprağı kontrol et. Yağış olasılığı %${precipitation}; yağmur yağarsa sulamayı ertele, yağmazsa toprak 5-10 cm derinlikte kuruysa akşam derinlemesine sulayabilirsin.`,
    };
  }

  return {
    topic: `${dayLabel} sulama önerisi`,
    answer: `${dayLabel} belirgin bir yağış beklenmiyor (olasılık %${precipitationProbability}). Toprak 5-10 cm derinlikte kuruysa ağacı yavaşça ve derinlemesine sulayabilirsin. Sıcaklık yaklaşık ${Math.round(temperature)}°C.`,
  };
};

const getWeatherReply = (weather: CampusWeather): AssistantReply => ({
  topic: `${weather.dayLabel} hava durumu`,
  answer: `${weather.dayLabel} yağış olasılığı %${weather.precipitationProbability}. Şu anki sıcaklık ${Math.round(weather.temperature)}°C ve mevcut yağış ${weather.precipitation} mm.`,
});

async function askGemini(question: string, weather?: CampusWeather): Promise<AssistantReply> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    config.gemini.model,
  )}:generateContent`;
  const response = await fetch(endpoint, {
    method: 'POST',
    signal: AbortSignal.timeout(45000),
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': config.gemini.apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [
          {
            text:
              'Sen Campus Green Care uygulamasının Türkçe bitki bakım asistanısın. ' +
              'Yalnızca ağaçlar, bitkiler, kampüs yeşil alanları, sulama, budama, dikim ve gübreleme ' +
              'konularında kısa, güvenli ve pratik yanıtlar ver. Sağlık, hukuk, finans veya tehlikeli ' +
              'konularda uzman olmadığını belirt. Yanıtı Türkçe ver, 2-4 kısa cümleyle sınırla ve kesin ' +
              'teşhis yerine uzman önerisi sun.',
          },
        ],
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: weather
                ? `Kullanıcının sorusu: ${question}\n\nKampüsün güncel hava verisi: Bugünkü maksimum yağış olasılığı %${weather.precipitationProbability}, mevcut yağış ${weather.precipitation} mm, sıcaklık ${weather.temperature}°C. Bu veriyi yanıtında dikkate al.`
                : question,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const answer = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();

  if (!answer) {
    throw new Error('Gemini returned an empty answer');
  }

  return { answer, topic: 'Gemini Bitki Asistanı' };
}

export const assistantController = {
  async ask(req: Request, res: Response, next: NextFunction) {
    try {
      const question =
        typeof req.body?.question === 'string' ? req.body.question.trim() : '';

      if (!question) {
        throw new BadRequestError('Soru boş olamaz');
      }

      if (question.length > 500) {
        throw new BadRequestError('Soru 500 karakterden uzun olamaz');
      }

      let reply: AssistantReply;
      let weather: CampusWeather | undefined;
      if (isWateringQuestion(question) || isWeatherQuestion(question)) {
        try {
          weather = await getCampusWeather(asksTomorrow(question) ? 1 : 0);
          reply = isWateringQuestion(question)
            ? getWateringReply(weather)
            : getWeatherReply(weather);
          res.json(reply);
          return;
        } catch (error) {
          console.warn(
            'Weather unavailable for watering advice:',
            error instanceof Error ? error.message : error,
          );
        }
      }

      if (config.gemini.apiKey) {
        try {
          reply = await askGemini(question, weather);
        } catch (error) {
          console.warn(
            'Gemini assistant unavailable, using local knowledge base:',
            error instanceof Error ? error.message : error,
          );
          reply = getKnowledgeBaseReply(question);
        }
      } else {
        reply = getKnowledgeBaseReply(question);
      }

      res.json(reply);
    } catch (error) {
      next(error);
    }
  },
};

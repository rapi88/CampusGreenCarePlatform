import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface WeeklyAward {
  photoUrl: string | null;
  text: string | null;
  userId: string | null;
}

export class AwardService {
  /**
   * Get the current weekly award from the settings table.
   */
  static async getWeeklyAward(): Promise<WeeklyAward> {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: ['weekly_award_photo_url', 'weekly_award_text', 'weekly_award_user_id']
        }
      }
    });

    const getSettingValue = (key: string) => {
      const setting = settings.find(s => s.key === key);
      return setting ? setting.value : null;
    };

    return {
      photoUrl: getSettingValue('weekly_award_photo_url'),
      text: getSettingValue('weekly_award_text'),
      userId: getSettingValue('weekly_award_user_id'),
    };
  }

  /**
   * Update the weekly award.
   */
  static async updateWeeklyAward(data: WeeklyAward): Promise<WeeklyAward> {
    const updateSetting = async (key: string, value: string | null) => {
      if (value !== null && value !== undefined) {
        await prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
      }
    };

    await prisma.$transaction(async () => {
      await updateSetting('weekly_award_photo_url', data.photoUrl);
      await updateSetting('weekly_award_text', data.text);
      await updateSetting('weekly_award_user_id', data.userId);
    });

    return data;
  }
}

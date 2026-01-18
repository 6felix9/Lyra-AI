import { Request, Response } from 'express';
import { databaseService } from '../services/database.service.js';

export async function bootstrapProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name } = req.body as { name?: string };
    const created = await databaseService.ensureUserProfile(userId, name || null);
    res.status(created ? 201 : 200).json({ created });
  } catch (error) {
    console.error('Failed to bootstrap profile:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const profile = await databaseService.getUserProfile(userId);
    if (!profile) {
      // If profile doesn't exist, create it
      await databaseService.ensureUserProfile(userId);
      const newProfile = await databaseService.getUserProfile(userId);
      if (!newProfile) {
        res.status(500).json({ error: 'Failed to create profile' });
        return;
      }
      res.json(newProfile);
      return;
    }

    res.json(profile);
  } catch (error) {
    console.error('Failed to get profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const body = req.body as {
      display_name?: string;
      preferences?: Record<string, unknown>;
    };

    const updated = await databaseService.updateUserProfile(userId, {
      display_name: body.display_name ?? undefined,
      preferences: body.preferences ?? undefined,
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

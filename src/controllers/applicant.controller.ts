import type { Request, Response } from 'express';

export const registerApplicant = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (!webhookUrl) {
      console.warn('GOOGLE_SHEETS_WEBHOOK_URL is not set in environment.');
      // return a success response anyway to avoid breaking frontend during development
      return res.status(200).json({ success: true, message: "No webhook configured, payload ignored." });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to forward data to Google Sheet.");
    }

    return res.status(200).json({ success: true, message: "Registration successful" });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

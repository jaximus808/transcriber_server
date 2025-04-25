import express, { Request, Response, NextFunction } from 'express';
import { DiscordAPI } from '../utils/discordapi';
import dotenv from 'dotenv';
import Docker from 'dockerode'; // Import dockerode

dotenv.config();
const router = express.Router();
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET!;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI!;

// Initialize Docker client
const docker = new Docker({ socketPath: '/home/observer/.docker/desktop/docker.sock' });

router.get('/callback', async (req: Request, res: Response): Promise<any> => {
  const code = req.headers['x-discord-code'] as string;
  if (!code) return res.status(400).send('Missing code');
  
  const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
      scope: 'identify guilds'
    })
  });
  
  if (!tokenRes.ok){
    console.log(tokenRes)
    return res.status(500).send({ok: false});
  }
  
  const { access_token } = await tokenRes.json();
  
  try {
    const api = new DiscordAPI(access_token);
    const user = await api.getUser();
    req.session.user = {
      info: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        discriminator: user.discriminator
      },
      accessToken: access_token
    };
    res.status(200).send({ok: true})
  } catch (err) {
    console.error('Discord API error:', err);
    res.status(500).send({ok: false});
  }
});

router.get('/get_info', async (req: Request, res: Response): Promise<any> => {
  if (!req.session.user) {
    return res.status(401).json({ loggedIn: false, message: 'Not logged in' });
  }
  return res.json({
    loggedIn: true,
    user: req.session.user.info
  });
});

// New route for starting transcription bot
router.post('/start_transcription', async (req: Request, res: Response): Promise<any> => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  
  const { guildId, company } = req.body;
  
  if (!guildId || !company) {
    return res.status(400).json({ success: false, message: 'maissing guild and company id' });
  }
  
  try {
    // Environment variables to pass to the container
    const envVars = [
      `DISCORD_BOT_TOKEN=${process.env.DISCORD_BOT_TOKEN}`,
      `DEV_OUTPUT_CHANNEL=${process.env.DEV_OUTPUT_CHANNEL}`,
      `GUILD_ID=${guildId}`,
      `TARGET_USER_ID=${req.session.user.info.id}`,
      `FOUNDRY_TOKEN=${process.env.FOUNDRY_TOKEN}`,
      `FOUNDRY_ENDPOINT=${process.env.FOUNDRY_ENDPOINT}`,
      `CURRENT_COMPANY=${company}`
    ];
    
    // Create and start the container
    const container = await docker.createContainer({
      Image: 'discord-transcription-bot:latest', // Make sure this image exists
      name: `transcription-bot-${req.session.user.info.id}-${Date.now()}`,
      Env: envVars,
      AttachStdout: true,
      AttachStderr: true,
      Tty: true,
      HostConfig: {
        AutoRemove: true, // Automatically remove the container when it exits
      }
    });
    
    await container.start();
    
    const containerInfo = await container.inspect();
    
    return res.status(200).json({
      success: true,
      message: 'Transcription bot started successfully',
      containerId: containerInfo.Id,
      startTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error starting transcription bot:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to start transcription bot',
      error: (error as Error).message
    });
  }
});


router.get('/user_voice_location', async (req: Request, res: Response): Promise<any> => {
  if (!req.session.user) {
    return res.status(401).json({ loggedIn: false, message: 'Not logged in' });
  }

  const userInfo = req.session.user.info
  
  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;

    // 1. Get user's guilds using their access token
    const userGuildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${req.session.user.accessToken}`
      }
    });

    if (!userGuildsRes.ok) {
      throw new Error('Failed to fetch user guilds');
    }

    const userGuilds = await userGuildsRes.json(); // Array of { id, name, ... }

    // console.log(userGuilds)

    for (const guild of userGuilds) {
      // 2. Try fetching voice state for that user in each guild
      const voiceStateRes = await fetch(`https://discord.com/api/v10/guilds/${guild.id}/voice-states/${userInfo.id}`, {
        headers: {
          Authorization: `Bot ${botToken}`
        }
      });

      // console.log(voiceStateRes.ok)
      if (voiceStateRes.ok) {
        const voiceState = await voiceStateRes.json();

        // console.log(voiceStateRes)
        // console.log(voiceState)
        return res.status(200).json({
          success: true,
          guildId: voiceState.guild_id,
          channelId: voiceState.channel_id,
          inVoice: true
        });
      }
    }

    return res.status(200).json({ success: true, inVoice: false });

  } catch (err) {
    console.error('Error checking user voice location:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: (err as Error).message
    });
  }
});


export default router;
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
const docker = new Docker();

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
  
  console.log("WTF IS AHPPENING")
  const { access_token } = await tokenRes.json();
  
  try {
    const api = new DiscordAPI(access_token);
    const user = await api.getUser();
    req.session.user = {
      id: user.id,
      username: user.username,
      avatar: user.avatar,
      discriminator: user.discriminator
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
    user: req.session.user
  });
});

// New route for starting transcription bot
router.post('/start_transcription', async (req: Request, res: Response): Promise<any> => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  
  const { guildId, channelId } = req.body;
  
  if (!guildId || !channelId) {
    return res.status(400).json({ success: false, message: 'Missing guild ID or channel ID' });
  }
  
  try {
    // Environment variables to pass to the container
    const envVars = [
      `DISCORD_TOKEN=${process.env.DISCORD_BOT_TOKEN}`,
      `GUILD_ID=${guildId}`,
      `CHANNEL_ID=${channelId}`,
      `USER_ID=${req.session.user.id}`
    ];
    
    // Create and start the container
    const container = await docker.createContainer({
      Image: 'discord-transcription-bot:latest', // Make sure this image exists
      name: `transcription-bot-${req.session.user.id}-${Date.now()}`,
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

export default router;
import os
import discord
import asyncio
import wave
import time
from dotenv import load_dotenv
from discord.ext import commands, voice_recv
from include.whisper import whisper

# Ensure opus is loaded for voice
discord.opus._load_default()

# Load environment variables
load_dotenv()
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
GUILD_ID = int(os.getenv("GUILD_ID"))
TARGET_USER_ID = int(os.getenv("TARGET_USER_ID"))  # User whose audio we target

# Load Whisper model
model = whisper.load_model("base")  # choose 'tiny', 'base', etc.

# Configure bot with all intents for voice and messages
bot = commands.Bot(command_prefix="!", intents=discord.Intents.all())

# In-memory buffer for PCM frames
audio_buffers: list[bytes] = []

async def send_to_palantirlandscape(message: str):
    guild = bot.get_guild(GUILD_ID)
    if guild:
        channel = discord.utils.get(guild.text_channels, name="palantirlandscape")
        if channel:
            await channel.send(message)

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")
    # Find target in voice
    guild = bot.get_guild(GUILD_ID)
    if not guild:
        print(f"Guild {GUILD_ID} not found.")
        return
    member = guild.get_member(TARGET_USER_ID)
    if not (member and member.voice and member.voice.channel):
        print("Target user not in a voice channel.")
        return
    # Connect using voice_recv
    vc: voice_recv.VoiceRecvClient = await member.voice.channel.connect(cls=voice_recv.VoiceRecvClient)
    print(f"Connected to voice channel: {member.voice.channel.name}")
    await send_to_palantirlandscape(f"Joined voice channel: {member.voice.channel.name}")

    # Define callback to collect PCM
    def callback(user, data: voice_recv.VoiceData):
        if user.id == TARGET_USER_ID:
            audio_buffers.append(data.pcm)

    # Start listening
    vc.listen(voice_recv.BasicSink(callback))
    # Kick off transcription loop
    bot.loop.create_task(record_and_transcribe())

async def record_and_transcribe():
    """
    Every 30 seconds, write buffered PCM to WAV, transcribe, and clear buffer.
    """
    while True:
        await asyncio.sleep(30)
        if not audio_buffers:
            print("No audio frames captured this interval.")
            continue
        # Dump to WAV
        timestamp = int(time.time())
        filename = f"./audio_segments/segment_{timestamp}_{TARGET_USER_ID}.wav"
        with wave.open(filename, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(48000)
            wf.writeframes(b"".join(audio_buffers))
        print(f"Saved recording: {filename}")
        # Transcribe with Whisper
        try:
            result = model.transcribe(filename)
            text = result.get('text','').strip()
            print(f"Transcription: {text}")
            await send_to_palantirlandscape(f"Transcription: {text}")
        except Exception as e:
            print(f"Error transcribing: {e}")
        # Clear buffer
        audio_buffers.clear()

@bot.command(name="ping")
async def ping(ctx: commands.Context):
    await ctx.send("Pong! 🏓")

if __name__ == "__main__":
    bot.run(TOKEN)
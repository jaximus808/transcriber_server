import os
import discord
import asyncio
import wave
import time
from dotenv import load_dotenv
from discord.ext import commands, voice_recv
from include.whisper import whisper
from internal.util import parser
from internal.foundry import api

# Ensure opus is loaded for voice
discord.opus._load_default()

# Load environment variables
load_dotenv()
TOKEN = os.getenv("DISCORD_BOT_TOKEN")
GUILD_ID = int(os.getenv("GUILD_ID"))
TARGET_USER_ID = int(os.getenv("TARGET_USER_ID"))  # User whose audio we target

COMPANY_TARGET = os.getenv("CURRENT_COMPANY")

# Load Whisper model
model = whisper.load_model("base")  # choose 'tiny', 'base', etc.

# Configure bot with all intents for voice and messages
bot = commands.Bot(command_prefix="!", intents=discord.Intents.all())

# Ignored users
ignored_users: set[int] = set()

# In-memory buffer for PCM frames
audio_buffers: dict[discord.User, list[bytes]] = {}

foundry_api = api.FoundryAPI(
    "/v2/ontologies/ontology-ef92f6b4-0076-41a3-a5c2-780c41133c87/actions/create-leadership-hierachy/applyBatch",
    api.API_METHODS.POST
)

async def msg_discord_server(message: str):
    guild = bot.get_guild(GUILD_ID)
    if guild:
        channel = discord.utils.get(guild.text_channels, name="palantirlandscape")
        if channel:
            await channel.send(message)

@bot.command(name="ignore")
async def ignore_user(ctx: commands.Context, member: discord.Member):
    """Usage: !ignore @user — thereafter we’ll drop their audio."""
    if member.id in ignored_users:
        await ctx.send(f"{member.display_name} is already ignored.")
    else:
        ignored_users.add(member.id)
        await ctx.send(f"Ignoring audio from {member.display_name}.")

@bot.command(name="unignore")
async def unignore_user(ctx: commands.Context, member: discord.Member):
    """Usage: !unignore @user — resume processing their audio."""
    if member.id not in ignored_users:
        await ctx.send(f"{member.display_name} wasn’t being ignored.")
    else:
        ignored_users.remove(member.id)
        await ctx.send(f"Stopped ignoring audio from {member.display_name}.")

@bot.command(name="ping")
async def ping(ctx: commands.Context):
    await ctx.send("Pong! 🏓")

@bot.command(name="stop")
async def stop_bot(ctx: commands.Context):
    """Usage: !stop — shuts down the transcription bot."""
    await ctx.send("Shutting down! 👋")
    # Gracefully close voice connections if any
    for vc in bot.voice_clients:
        await vc.disconnect()
    # Close the bot
    await bot.close()

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user} (ID: {bot.user.id})")
    guild = bot.get_guild(GUILD_ID)
    if not guild:
        print(f"Guild {GUILD_ID} not found.")
        return
    member = guild.get_member(TARGET_USER_ID)
    if not (member and member.voice and member.voice.channel):
        print("Target user not in a voice channel.")
        return

    vc: voice_recv.VoiceRecvClient = await member.voice.channel.connect(
        cls=voice_recv.VoiceRecvClient
    )
    print(f"Connected to voice channel: {member.voice.channel.name}")
    await msg_discord_server(f"Joined voice channel: {member.voice.channel.name}")
    await msg_discord_server(f"I'll be recording the client landscape for this meeting for the copany {COMPANY_TARGET}, you can monitor the client landscape at https://clientlandscape-5ilramrr6upknllk.apps.usw-18.palantirfoundry.com/ in realtime!")
    await msg_discord_server(f"To stop recording use !stop")

    def callback(user: discord.User, data: voice_recv.VoiceData):
        if not user or user.id in ignored_users:
            return
        audio_buffers.setdefault(user, []).append(data.pcm)

    vc.listen(voice_recv.BasicSink(callback))
    bot.loop.create_task(record_and_transcribe())

async def record_and_transcribe():
    """
    Every 20 seconds, write buffered PCM to WAV, transcribe, and clear buffer.
    """
    while True:
        await asyncio.sleep(20)
        payload = []
        for user, audio_buffer in list(audio_buffers.items()):
            if not audio_buffer:
                continue

            timestamp = int(time.time())
            filename = f"./audio_segments/segment_{timestamp}_{user.display_name}.wav"
            with wave.open(filename, "wb") as wf:
                wf.setnchannels(2)
                wf.setsampwidth(2)
                wf.setframerate(48000)
                wf.writeframes(b"".join(audio_buffer))
            audio_buffer.clear()

            try:
                result = model.transcribe(filename)
                text = result.get('text', '').strip()
                fn, ln, role, team = parser.parse_display_name(user.display_name)
                payload.append({
                    "parameters": {
                        "sp_fname": fn,
                        "sp_lname": ln,
                        "sp_role": role,
                        "sp_team": team,
                        "user_message": text,
                        "client_org_name": COMPANY_TARGET
                    }
                })
                await msg_discord_server(f"Transcription for {user.display_name}: {text}")
            except Exception as e:
                print(f"Error transcribing: {e}")

        if payload:
            foundry_api.apply({ "requests": payload })

if __name__ == "__main__":
    bot.run(TOKEN)

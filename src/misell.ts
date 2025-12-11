import { GatewayIntentBits } from 'discord.js';
import { Misell } from './instances/Misell';
import { BOT_TOKEN } from './config';

const misell = new Misell({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildExpressions,
		GatewayIntentBits.GuildVoiceStates,
	],
});

misell.login(BOT_TOKEN);

// delete-commands.ts
import { BOT_TOKEN, CLIENT_ID, GUILD_ID } from '@/config';
import { REST, Routes } from 'discord.js';

if (!BOT_TOKEN || !CLIENT_ID) {
  throw new Error('DISCORD_TOKEN and CLIENT_ID must be set in environment variables.');
}

// Minimal type for what we care about
type ApiCommand = {
  id: string;
  name: string;
};

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

async function deleteGlobalCommands() {
  console.log('Fetching global application (/) commands...');

  const commands = (await rest.get(
    Routes.applicationCommands(CLIENT_ID),
  )) as ApiCommand[];

  console.log(`Found ${commands.length} global command(s).`);

  for (const command of commands) {
    console.log(`Deleting global command: ${command.name} (${command.id})`);
    await rest.delete(Routes.applicationCommand(CLIENT_ID, command.id));
  }

  console.log('Finished deleting all global commands.');
}

async function deleteGuildCommands(guildId: string) {
  console.log(`Fetching guild application (/) commands for guild ${guildId}...`);

  const commands = (await rest.get(
    Routes.applicationGuildCommands(CLIENT_ID, guildId),
  )) as ApiCommand[];

  console.log(`Found ${commands.length} guild command(s) in ${guildId}.`);

  for (const command of commands) {
    console.log(`Deleting guild command: ${command.name} (${command.id})`);
    await rest.delete(
      Routes.applicationGuildCommand(CLIENT_ID, guildId, command.id),
    );
  }

  console.log(`Finished deleting all guild commands for ${guildId}.`);
}

async function main() {
  try {
    // Delete all global commands
    await deleteGlobalCommands();

    // If you want to also delete commands from a specific guild
    if (GUILD_ID) {
      await deleteGuildCommands(GUILD_ID);
    }
  } catch (error) {
    console.error('Error while deleting commands:', error);
  }
}

main();
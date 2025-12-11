import { BOT_TOKEN, CLIENT_ID, GUILD_ID } from '@/config';
import { ClientEvent, Command, EmbedManager, InteractionManager, type Middleware } from '@/instances';
import { DeferReply } from '@/middlewares';
import { logger } from '@/utilities';
import { pathToFileURL } from 'bun';
import {
	Client,
	type ClientOptions,
	Collection,
	REST,
	type RESTPostAPIChatInputApplicationCommandsJSONBody,
	Routes
} from 'discord.js';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import type { BaseLogger } from 'pino';

class Misell extends Client {
	public readonly logger: BaseLogger;
	public readonly embed: EmbedManager;
	public readonly interaction: InteractionManager;
	public readonly globalMiddlewares: Middleware[];
	public maintenance: boolean = false;
	public commands: Collection<string, Command> = new Collection();

	constructor(options: ClientOptions) {
		super(options);

		// Logger
		this.logger = logger;

		// Embed
		this.embed = new EmbedManager();

		// Interaction
		this.interaction = new InteractionManager();

		// Register
		this.registerEvents();
		this.registerCommands();

		// Global middlewares
		this.globalMiddlewares = [DeferReply];
	}

	private async registerEvents() {
		this.logger.info('Loading events...');
		const clientEvents = [];

		for await (const file of glob('src/events/**/*.ts', {})) {
			const filePath = pathToFileURL(path.resolve(file)).href;
			const module = await import(filePath);
			const ClassRef = module.default;

			if (ClassRef && typeof ClassRef === 'function') {
				const instance = new ClassRef(this);
				if (instance instanceof ClientEvent) {
					instance.register();

					const eventName = path.basename(file, '.ts')
					clientEvents.push(eventName);
				}
			}
		}

		this.logger.info(`Loaded ${clientEvents.length} events`);
	}

	private async registerCommands() {
		for await (const file of glob('src/commands/**/*.ts', {})) {
			const filePath = pathToFileURL(path.resolve(file)).href;
			const module = await import(filePath);
			const ClassRef = module.default;

			if (ClassRef && typeof ClassRef === 'function') {
				const instance = new ClassRef();
				if (instance instanceof Command) {
					instance.useGlobal(...this.globalMiddlewares);
					this.commands.set(instance.data.name, instance);
				}
			}
		}

		// Start registering command
		const commands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
		const devCommands: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];

		for (const command of this.commands.values()) {
			if (command.isGuildOnly) {
				devCommands.push(command.data.toJSON());
			} else {
				commands.push(command.data.toJSON());
			}
		}

		this.logger.info('Loading commands...');

		const rest = new REST().setToken(BOT_TOKEN);

		await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
			body: devCommands,
		});

		await rest.put(Routes.applicationCommands(CLIENT_ID), {
			body: commands,
		});

		this.logger.info(`Loaded ${this.commands.size} commands`);
	}

	private async requestCardInfo() {

	}
}

export { Misell };


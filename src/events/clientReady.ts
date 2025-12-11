import { ClientEvent, Misell } from '@/instances';
import { ActivityType, Events } from 'discord.js';

class ClientReadyEvent extends ClientEvent {
	constructor(client: Misell) {
		super(client);
	}

	register(): void {
		this.client.on(Events.ClientReady, async () => {
			// Presence
			this.client.user?.setPresence({
				activities: [
					{
						name: "シロの命令",
						type: ActivityType.Listening,
					},
				],
				status: 'online',
			});

			this.client.logger.info(`Logged in as ${this.client.user?.tag}!`);
		});

		return;
	}
}

export default ClientReadyEvent;

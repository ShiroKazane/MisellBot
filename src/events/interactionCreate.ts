import { ClientEvent, Misell } from '@/instances'
import { Events } from 'discord.js'

class InteractionCreateEvent extends ClientEvent {
    constructor(client: Misell) {
        super(client)
    }

    register(): void {
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return

            const command = this.client.commands.get(interaction.commandName)
            if (!command) {
                throw new Error(
                    `There is no command with name ${interaction.commandName}`
                )
            }

            try {
                await command.execute(this.client, interaction)
            } catch (error) {
                this.client.logger.error(error)
            }
        })

        return
    }
}

export default InteractionCreateEvent
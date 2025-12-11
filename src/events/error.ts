import { ClientEvent, Misell } from '@/instances'
import { Events } from 'discord.js'

class ErrorEvent extends ClientEvent {
    constructor(client: Misell) {
        super(client)
    }

    register(): void {
        this.client.on(Events.Error, async (error) => {
            this.client.logger.error(error)
        })

        return
    }
}

export default ErrorEvent
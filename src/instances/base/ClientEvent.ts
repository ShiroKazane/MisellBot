import type { Misell } from '@/instances'

abstract class ClientEvent {
    public readonly client: Misell

    constructor(client: Misell) {
        this.client = client
    }

    abstract register(): void
}

export { ClientEvent }

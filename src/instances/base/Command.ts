import {
    InteractionContextType,
    type ChatInputCommandInteraction,
    type SlashCommandBuilder,
} from 'discord.js'
import type { Misell } from '../Misell'

type Middleware<TContext = unknown> = (
    client: Misell,
    interaction: ChatInputCommandInteraction,
    next: () => Promise<void>,
    context: TContext
) => Promise<void>

abstract class Command {
    public data: SlashCommandBuilder
    public isGuildOnly: boolean = false
    private middlewares: Middleware[] = []

    constructor(data: SlashCommandBuilder) {
        this.data = data.setContexts(InteractionContextType.PrivateChannel, InteractionContextType.BotDM, InteractionContextType.Guild)
    }

    abstract command(
        client: Misell,
        interaction: ChatInputCommandInteraction,
        context: unknown
    ): Promise<void>

    async execute(client: Misell, interaction: ChatInputCommandInteraction) {
        const context: unknown = {}
        let index = -1
        const dispatch = async (i: number): Promise<void> => {
            if (i <= index) {
                throw new Error('next() called multiple times')
            }
            index = i
            let fn:| Middleware | (( client: Misell, interaction: ChatInputCommandInteraction, context: unknown) => Promise<void>)
            if (i === this.middlewares.length) {
                fn = async (_client, _interaction, _next, ctx) => {
                    await this.command(client, interaction, ctx)
                }
            } else {
                fn = this.middlewares[i]
            }
            await fn(client, interaction, async () => {
                await dispatch(i + 1)
            }, context)
        }

        await dispatch(0)
    }

    use(...middleware: Middleware<any>[]) {
        middleware.forEach((m) => { this.middlewares.push(m); })
    }

    useGlobal(...middleware: Middleware<any>[]) {
        middleware.forEach((m) => { this.middlewares.unshift(m); })
    }
}

export { Command }
export type { Middleware }


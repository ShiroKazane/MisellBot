import type {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
} from 'discord.js'
import type { Misell } from '../Misell'

type SubcommandMiddleware<TContext = unknown> = (
    client: Misell,
    interaction: ChatInputCommandInteraction,
    next: () => Promise<void>,
    context: TContext
) => Promise<void>

abstract class Subcommand {
    public isGuildOnly: boolean = false
    private middlewares: SubcommandMiddleware[] = []

    abstract command(
        client: Misell,
        interaction: ChatInputCommandInteraction,
        context: unknown
    ): Promise<void>

    async execute(
        client: Misell,
        interaction: ChatInputCommandInteraction,
        ctx: unknown
    ) {
        const context: unknown = ctx
        let index = -1
        const dispatch = async (i: number): Promise<void> => {
            if (i <= index) {
                throw new Error('next() called multiple times')
            }
            index = i
            let fn:| SubcommandMiddleware| ((client: Misell, interaction: ChatInputCommandInteraction, context: unknown) => Promise<void>)
            if (i === this.middlewares.length) {
                fn = async (_client, _interaction, _next, ctx) => {
                    await this.command(client, interaction, ctx)
                }
            } else {
                fn = this.middlewares[i]
            }
            await fn( client, interaction, async () => {
                await dispatch(i + 1)
            }, context)
        }

        await dispatch(0)
    }

    use(...middleware: SubcommandMiddleware<any>[]) {
        middleware.forEach((m) => { this.middlewares.push(m); })
    }

    abstract configure(data: SlashCommandBuilder): Promise<void>
}

export { Subcommand }
export type { SubcommandMiddleware }


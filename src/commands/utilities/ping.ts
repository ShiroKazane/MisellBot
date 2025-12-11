import { Command, EMBEDTYPE, type Misell } from '@/instances'
import t from '@/locale'
import {
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from 'discord.js'

const data = new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!')
    .setNameLocalization('ja', 'ピング')
    .setDescriptionLocalization('ja', 'ポン！と返信します')

class Ping extends Command {
    constructor() {
        super(data)
    }

    async command(client: Misell, interaction: ChatInputCommandInteraction) {
        const embed = client.embed.createMessageEmbedWithAuthor(
            `${t('pong', interaction.locale)} \`${Math.floor(client.ws.ping)}ms\``,
            interaction,
            EMBEDTYPE.GLOBAL
        )

        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Ping
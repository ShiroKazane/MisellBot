import { Command, EMBEDTYPE, type Misell } from '@/instances'
import t from '@/locale'
import {
    SlashCommandBuilder,
    type ChatInputCommandInteraction
} from 'discord.js'

const data = new SlashCommandBuilder()
    .setName('test')
    .setDescription('Testing command')
    .setNameLocalization('ja', 'テスト')
    .setDescriptionLocalization('ja', 'テストコマンドです')

class Ping extends Command {
    constructor() {
        super(data)
    }

    async command(client: Misell, interaction: ChatInputCommandInteraction) {
        const embed = client.embed.createMessageEmbedWithAuthor(
            `${t('locale', interaction.locale)} ${interaction.locale}`,
            interaction,
            EMBEDTYPE.GLOBAL
        )

        await client.interaction.replyEmbed(interaction, embed)
    }
}

export default Ping
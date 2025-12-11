import { Command, EMBEDTYPE, type Misell } from '@/instances'
import t from '@/locale'
import { createCanvas } from '@napi-rs/canvas'
import {
  AttachmentBuilder,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type ColorResolvable,
} from 'discord.js'

const data = new SlashCommandBuilder()
    .setName('color')
    .setDescription('Show a color')
    .setNameLocalization('ja', 'カラー')
    .setDescriptionLocalization('ja', '色を表示します')
    .addStringOption(option =>
        option
            .setName('value')
            .setDescription('The hex value of the color (e.g., #FFFFFF or FFFFFF)')
            .setNameLocalization('ja', '値')
            .setDescriptionLocalization('ja', '色の16進値（例：#FFFFFFまたはFFFFFF）')
            .setRequired(true)
    )

class Color extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
    }

    async command(client: Misell, interaction: ChatInputCommandInteraction) {
        const input = interaction.options.getString('value', true).trim()

        let hex = input.toLowerCase()
        if (hex.startsWith('#')) hex = hex.slice(1)

        if (/^[0-9a-f]{3}$/.test(hex)) {
          hex = hex.split('').map(c => c + c).join('')
        }

        if (!/^[0-9a-f]{6}$/.test(hex)) {
          await client.interaction.replyEmbed(
            interaction,
            client.embed.createMessageEmbed(
              t('invalid-hex', interaction.locale),
              interaction,
              EMBEDTYPE.ERROR
            ),
            { ephemeral: true }
          )
          return
        }

        const normalized = `#${hex}`

        // Create PNG preview (256×256)
        const canvas = createCanvas(256, 256)
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = normalized
        ctx.fillRect(0, 0, 256, 256)

        const preview = new AttachmentBuilder(canvas.toBuffer('image/png'), {
            name: 'color.png',
        })

        // Build embed
        const embed = client.embed.createMessageEmbedWithImage(
            `\`${t('hex', interaction.locale)} ${normalized.toUpperCase()}\``,
            interaction,
            'attachment://color.png',
            EMBEDTYPE.GLOBAL,
            `${normalized}` as ColorResolvable
        )

        await client.interaction.replyEmbed(interaction, embed, { files: [preview] })
    }
}

export default Color

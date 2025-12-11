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
    .setName('compare')
    .setDescription('Compare two color')
    .setNameLocalization('ja', '比較')
    .setDescriptionLocalization('ja', '2つの色を比較します')
    .addStringOption(option =>
        option
            .setName('first')
            .setDescription('The hex value of the color (e.g., #FFFFFF)')
            .setNameLocalization('ja', '最初')
            .setDescriptionLocalization('ja', '色の16進値（例：#FFFFFF）')
            .setRequired(true)
    )
    .addStringOption(option =>
        option
            .setName('second')
            .setDescription('The hex value of the color (e.g., #F3F6FB)')
            .setNameLocalization('ja', '二番目')
            .setDescriptionLocalization('ja', '色の16進値（例：#F3F6FB）')
            .setRequired(true)
    )

class Color extends Command {
    constructor() {
        super(data as SlashCommandBuilder)
    }

    normalizeHex(value: string): string | null {
      let hex = value.toLowerCase()
      if (hex.startsWith('#')) hex = hex.slice(1)

      if (/^[0-9a-f]{3}$/.test(hex)) {
        hex = hex.split('').map(c => c + c).join('')
      }

      if (!/^[0-9a-f]{6}$/.test(hex)) return null

      return `#${hex}`
    }

    async command(client: Misell, interaction: ChatInputCommandInteraction) {
        const first = interaction.options.getString('first', true).trim()
        const second = interaction.options.getString('second', true).trim()

        const firstNormalized = this.normalizeHex(first)
        const secondNormalized = this.normalizeHex(second)
        if (!firstNormalized || !secondNormalized) {
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

        // Create PNG preview (256×256)
        const canvas = createCanvas(256, 256)
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = firstNormalized
        ctx.fillRect(0, 0, 256 / 2, 256)

        ctx.fillStyle = secondNormalized
        ctx.fillRect(256 / 2, 0, 256 / 2, 256)

        const preview = new AttachmentBuilder(canvas.toBuffer('image/png'), {
            name: 'compare.png',
        })

        // Build embed
        const embed = client.embed.createMessageEmbedWithImage(
            `\`${t('compare', interaction.locale)} ${firstNormalized.toUpperCase()} - ${secondNormalized.toUpperCase()}\``,
            interaction,
            'attachment://compare.png',
            EMBEDTYPE.GLOBAL,
            `${firstNormalized}` as ColorResolvable
        )

        await client.interaction.replyEmbed(interaction, embed, { files: [preview] })
    }
}

export default Color

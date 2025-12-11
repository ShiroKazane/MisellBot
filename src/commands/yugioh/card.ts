import { Command, EMBEDTYPE, type Misell } from '@/instances'
import t from '@/locale'
import cardDB from '@/utilities/card'
import { fuzzy } from '@/utilities/fuse'
import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from 'discord.js'

const data = new SlashCommandBuilder()
  .setName('card')
  .setDescription('Search for a Yu-Gi-Oh! card')
  .setNameLocalization('ja', 'カード')
  .setDescriptionLocalization('ja', '遊戯王カードを検索します')
  .addStringOption(option =>
    option
      .setName('name')
      .setDescription('Exact card name')
      .setNameLocalization('ja', '名前')
      .setDescriptionLocalization('ja', '正確なカード名')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('jp')
      .setDescription('Output card information in Japanese')
      .setNameLocalization('ja', '日本語')
      .setDescriptionLocalization('ja', 'カード情報を日本語で出力します（日本語ロケール以外でも有効）')
      .setRequired(false)
  )

class Card extends Command {
  constructor() {
    super(data as SlashCommandBuilder)
  }

  async command(client: Misell, interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('name', true)
    const forceJP = interaction.options.getBoolean('jp') || false;

    await cardDB.load()

    const { best, bestId, score } = await fuzzy(query, 8)

    if (!best || !bestId || score > 0.7) {
      await client.interaction.replyEmbed(
        interaction,
        client.embed.createMessageEmbed(
          `${t('card-not-found', interaction.locale)} **${query}**.`,
          interaction,
          EMBEDTYPE.ERROR,
        ),
        { ephemeral: true },
      )
      return
    }

    // find merged card entry
    const list = cardDB.all
    const found = list.find(c => c.id === bestId)
    if (!found) {
      await client.interaction.replyEmbed(
        interaction,
        client.embed.createMessageEmbed(
          t('failed-resolve-card', interaction.locale),
          interaction,
          EMBEDTYPE.ERROR,
        ),
        { ephemeral: true },
      )
      return
    }

    const useJA = forceJP || interaction.locale.startsWith('ja')
    const raw = useJA ? found.rawJa ?? found.rawEn : found.rawEn ?? found.rawJa

    if (!raw) {
      await client.interaction.replyEmbed(
        interaction,
        client.embed.createMessageEmbed(
          t('data-unavailable', interaction.locale),
          interaction,
          EMBEDTYPE.ERROR,
        ),
        { ephemeral: true },
      )
      return
    }

    const name = raw.name ?? best
    const desc: string =
      raw.desc?.length > 1024
        ? `${raw.desc.slice(0, 1021)}...`
        : raw.desc ?? t('no-description', interaction.locale)

        // typeline formatting
    const typeLine = Array.isArray(raw.typeline)
      ? raw.typeline.join(' / ')
      : raw.type ?? t('unknown', interaction.locale)

    // attribute/level/atk/def
    const attribute = raw.attribute ?? raw.attr ?? t('unknown', interaction.locale)
    const level = raw.level ?? raw.linkval ?? '-'
    const atk = raw.atk === -1 ? '?' : raw.atk ?? '0'
    const def = raw.def === -1 ? '?' : raw.def ?? (raw.linkval != null ? '—' : '0')

    // image
    let imagePath: string | null = null
    const img = raw.card_images?.[0]?.image_url
    if (img) {
      try {
        imagePath = await cardDB.image(img, `${raw.id}.jpg`)
      } catch (err) {
        client.logger.error(`Failed to download card image: ${err}`)
      }
    }

    // embed
    const embed = client.embed.createMessageEmbedWithThumbnail(
      `**Type**: ${typeLine}\n` +
      `**Attribute**: ${attribute}\n` +
      `**Level**: ${level}  **ATK**: ${atk}  **DEF**: ${def}`,
      interaction,
      'attachment://card.jpg',
      EMBEDTYPE.GLOBAL,
    )

    embed.setTitle(name)
    embed.addFields({
      name: t('description', found.rawJa && useJA ? "ja" : interaction.locale),
      value: desc,
    })

    await client.interaction.replyEmbed(interaction, embed, {
      files: imagePath ? [{ attachment: imagePath, name: 'card.jpg' }] : [],
    })
  }
}

export default Card

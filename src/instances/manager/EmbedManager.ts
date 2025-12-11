import { COLOR } from '@/config';
import t from '@/locale';
import { ChatInputCommandInteraction, type ColorResolvable, EmbedBuilder, type GuildMember, type Interaction, TextChannel } from 'discord.js';

enum EMBEDTYPE {
	GLOBAL = 'GLOBAL',
	SUCCESS = 'SUCCESS',
	WARNING = 'WARNING',
	ERROR = 'ERROR',
}

class EmbedManager {
	public createMessageEmbedWithAuthor(message: string, interaction: Interaction, type: EMBEDTYPE, color?: ColorResolvable): EmbedBuilder {
		return new EmbedBuilder()
			.setColor(color ? color : COLOR[type])
			.setAuthor({
				name: interaction.user.displayName,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setDescription(message)
			.setTimestamp()
			.setFooter({
				text: t('footer', interaction.locale),
			});
	}

	public createMessageEmbedWithImage(message: string, interaction: Interaction, image: string, type: EMBEDTYPE, color?: ColorResolvable): EmbedBuilder {
		return new EmbedBuilder()
			.setColor(color ? color : COLOR[type])
			.setAuthor({
				name: interaction.user.displayName,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setImage(image)
			.setDescription(message)
			.setTimestamp()
			.setFooter({
				text: t('footer', interaction.locale),
			});
	}

	public createMessageEmbedWithThumbnail(message: string, interaction: Interaction, thumbnail: string, type: EMBEDTYPE, color?: ColorResolvable): EmbedBuilder {
		return new EmbedBuilder()
			.setColor(color ? color : COLOR[type])
			.setAuthor({
				name: interaction.user.displayName,
				iconURL: interaction.user.displayAvatarURL(),
			})
			.setThumbnail(thumbnail)
			.setDescription(message)
			.setTimestamp()
			.setFooter({
				text: t('footer', interaction.locale),
			});
	}

	public createMessageEmbed(message: string, interaction: Interaction, type: EMBEDTYPE, color?: ColorResolvable): EmbedBuilder {
		return new EmbedBuilder().setColor(color ? color : COLOR[type]).setDescription(message).setTimestamp().setFooter({
			text: t('footer', interaction.locale),
		});
	}

	public createSuccessLoggerEmbed(interaction: ChatInputCommandInteraction) {
		const member = interaction.member as GuildMember;
		const channel = interaction.channel as TextChannel;

		return new EmbedBuilder()
			.setColor(COLOR.GLOBAL)
			.setAuthor({
				name: member.displayName,
				iconURL: member.displayAvatarURL(),
			})
			.setThumbnail(interaction.guild?.iconURL() || '')
			.setDescription(`Someone ran a command`)
			.addFields(
				{
					name: 'Command',
					value: interaction.commandName,
					inline: false,
				},
				{
					name: 'Full Command',
					value: interaction.toString(),
					inline: false,
				},
				{
					name: 'Member',
					value: member.displayName,
					inline: true,
				},
				{
					name: 'Channel',
					value: channel.name,
					inline: true,
				},
				{
					name: 'Guild',
					value: interaction.guild?.name || '',
					inline: true,
				},
			)
			.setTimestamp()
			.setFooter({
				text: t('footer', 'en-US'),
			});
	}

	public createErrorLoggerEmbed(error: Error) {
		return new EmbedBuilder()
			.setColor(COLOR.ERROR)
			.setDescription('# There is an error!')
			.addFields({
				name: 'Error Message',
				value: error.message,
				inline: false,
			})
			.setTimestamp()
			.setFooter({
				text: t('footer', 'en-US'),
			});
	}
}

export { EmbedManager, EMBEDTYPE };


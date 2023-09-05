const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require("discord.js");
const config = require('./config');
const moment = require('moment');
const database = require("./database");
require('moment-duration-format');

const client = new Client({
    intents: [
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent
    ],
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.GuildScheduledEvent,
        Partials.Message,
        Partials.Reaction,
        Partials.ThreadMember,
        Partials.User
    ]
});

client.config = new Collection();
client.commands = new Collection();
client.database = new Collection();
client.events = new Collection();

client.config = config;

client.on('ready', async () => {
    console.log(`BOT >> iniciado.`)
});

client.on('voiceStateUpdate', async (oldMember, newMember) => {
    const oldVoice = oldMember.channelId
    const newVoice = newMember.channelId;

    const roleStaff = 'CARGO_STAFF';
    const parentId = 'ID_DA_CATEGORIA_DOS_CANAIS'

    if (newMember.member.user.bot) return;

    if (oldVoice === null) {
        //entrou em call
        try {
            if (!newMember.member.roles.cache.has(roleStaff)) return;
            if (newMember.channel.parent.id != parentId) return;
            (await database('set', `join_call_${newMember.id}`, Date.now()));
        } catch (err) {
            console.log(err);
        };
    } else if (newVoice === null) {
        //saiu de call
        try {
            if (!oldMember.member.roles.cache.has(roleStaff)) return;
            if (oldMember.channel.parent.id != parentId) return;

            let joinCall = (await database('get', `join_call_${oldMember.id}`));
            if (!joinCall) return;

            let tempoCall = Date.now() - joinCall;
            let tempoTotalCall = (await database('get', `tempo_call_${oldMember.id}`));
            if (!tempoTotalCall) tempoTotalCall = 0;
            (await database('set', `tempo_call_${oldMember.id}`, tempoCall + tempoTotalCall));
        } catch (err) {
            console.log(err);
        };
    };
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (!message.content.startsWith(client.config.prefix)) return;

    const args = message.content.slice(client.config.prefix.length).trim().split(/\s+/g);

    if (message.content.toLocaleLowerCase() === `${client.config.prefix}tempocall`) {
        const user = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.author;

        if (!(await database('get', `tempo_call_${user.id}`))) {
            await message.channel.send({
                embeds: [
                    new EmbedBuilder()
                        .setColor('DarkPurple')
                        .setTitle(`${message.guild.name} | Tempo Em Call`)
                        .setDescription(`<@${user.id}> \`${user.tag}\` Não possui tempo contado em call.`)
                        .setFooter({ text: `Essa mensagem sumirá em 10 segundos.` })
                        .setThumbnail(user.avatarURL({ size: 4096 }))
                ]
            }).then(async (msg) => {
                setTimeout(() => {
                    msg.delete().catch(err => { })
                }, 10000)
            });
            return;
        };

        await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setColor('DarkPurple')
                    .setTitle(`${message.guild.name} | Tempo Em Call`)
                    .setDescription(`<@${user.id}> \`${user.tag}\` possui ${moment.duration((await database('get', `tempo_call_${user.id}`))).format("h [hours] m [minutes] e s [seconds]")} em call.`)
                    .setFooter({ text: `Essa mensagem sumirá em 10 segundos.` })
                    .setThumbnail(user.avatarURL({ size: 4096 }))
            ]
        }).then(async (msg) => {
            setTimeout(() => {
                msg.delete().catch(err => { })
            }, 10000)
        });
    };
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId === 'viewTimeButton') {
        return;
    };
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    if (interaction.commandName === 'viewTimeCommand') {
        return;
    };
});

client.login(client.config.discordToken).then(
    console.log(`BOT >> conectado.`)
);
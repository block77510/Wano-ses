const http = require('http');
http.createServer((req, res) => {
    res.write("Ses Botu 7/24 Kesintisiz Aktif!");
    res.end();
}).listen(process.env.PORT || 3000);

const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const TOKEN = process.env.TOKEN; 
const SES_KANAL_ID = "1522909681658630215"; 

function seseBaglan() {
    const kanal = client.channels.cache.get(SES_KANAL_ID);
    if (!kanal) return console.log("⚠️ Belirtilen ses kanalı bulunamadı!");

    try {
        joinVoiceChannel({
            channelId: kanal.id,
            guildId: kanal.guild.id,
            adapterCreator: kanal.guild.voiceAdapterCreator,
            selfMute: false,
            selfDeaf: true
        });
        console.log(`🔊 Bot ses kanalına başarıyla giriş yaptı: ${kanal.name}`);
    } catch (err) {
        console.error("❌ Ses kanalına bağlanırken hata oluştu:", err);
    }
}

client.once('ready', () => {
    console.log(`🤖 Ses botu aktif: ${client.user.tag}`);
    client.user.setActivity('https://discord.gg/HwsAPbqKJa', { type: 0 }); 
    seseBaglan();
});

client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.member && oldState.member.id === client.user.id && !newState.channelId) {
        console.log("⚠️ Bot sesten düştü, 5 saniye sonra tekrar bağlanılıyor...");
        setTimeout(() => seseBaglan(), 5000);
    }
});

client.login(TOKEN);

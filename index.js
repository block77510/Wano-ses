const http = require('http');
http.createServer((req, res) => {
    res.write("Wano Muzik ve Ses Botu Aktif!");
    res.end();
}).listen(process.env.PORT || 10000);

const { Client, GatewayIntentBits, Message, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const TOKEN = process.env.TOKEN; 
let SES_KANAL_ID = "1522909681658630215"; // Varsayılan başlangıç ses kanalı

const player = createAudioPlayer();
let su AnkiBaglanti = null;

// Sese Bağlanma Motoru
function seseBaglan(kanalId, guild) {
    const kanal = guild.channels.cache.get(kanalId);
    if (!kanal) return null;

    suAnkiBaglanti = joinVoiceChannel({
        channelId: kanal.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfMute: false,
        selfDeaf: false // Müzik çalacağı için sağırlaştırmayı kapattık
    });

    suAnkiBaglanti.subscribe(player);
    return kanal;
}

client.once('ready', () => {
    console.log(`🤖 Müzik Botu Aktif: ${client.user.tag}`);
    client.user.setActivity('https://discord.gg/HwsAPbqKJa', { type: 0 }); 

    // Bot ilk açıldığında varsayılan kanala girsin
    const ilkGuild = client.guilds.cache.first();
    if (ilkGuild) {
        seseBaglan(SES_KANAL_ID, ilkGuild);
    }
});

// Komut İşleyici Motoru
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;

    const args = message.content.split(' ');
    const komut = args[0].toLowerCase();

    // !gel <kanal-id> Komutu
    if (komut === '!gel') {
        const yeniKanalId = args[1];
        if (!yeniKanalId) return message.reply('⚠️ Lütfen geçiş yapmak istediğim ses kanalının ID\'sini yazın! Örn: `!gel 1522909...`');

        const baglanildi Mi = seseBaglan(yeniKanalId, message.guild);
        if (baglanildiMi) {
            SES_KANAL_ID = yeniKanalId; // Yeni kanalı hafızaya al
            return message.reply(`✅ Başarıyla yeni ses kanalına geçiş yaptım: **${baglanildiMi.name}**`);
        } else {
            return message.reply('❌ Belirttiğiniz ID\'ye sahip bir ses kanalı bulunamadı!');
        }
    }

    // !play <link/şarkı adı> Komutu
    if (komut === '!play') {
        const aramaSorgusu = args.slice(1).join(' ');
        if (!aramaSorgusu) return message.reply('⚠️ Lütfen çalmak istediğiniz şarkının adını veya SoundCloud/YouTube linkini girin!');

        // Eğer bot o sırada seste değilse sese sok
        if (!suAnkiBaglanti) {
            seseBaglan(SES_KANAL_ID, message.guild);
        }

        const bilgiMesaji = await message.reply('🔍 Şarkı aranıyor ve hazırlanıyor...');

        try {
            // Şarkıyı play-dl kütüphanesi ile aratıp açıyoruz
            let aramaSonucu = await play.search(aramaSorgusu, { limit: 1 });
            if (!aramaSonucu || aramaSonucu.length === 0) return bilgiMesaji.edit('❌ Şarkı bulunamadı!');

            let stream = await play.stream(aramaSonucu[0].url);
            let resource = createAudioResource(stream.stream, { inputType: stream.type });

            player.play(resource);
            
            const embed = new EmbedBuilder()
                .setTitle('🎶 Şu Anda Çalınıyor')
                .setDescription(`[${aramaSonucu[0].title}](${aramaSonucu[0].url})`)
                .setColor('#2ecc71')
                .setFooter({ text: `İsteyen: ${message.author.username}` });

            await bilgiMesaji.edit({ content: null, embeds: [embed] });
        } catch (err) {
            console.error(err);
            await bilgiMesaji.edit('❌ Şarkı oynatılırken bir hata oluştu! (Discord telif engeline takılmış olabilir, başka şarkı veya SoundCloud linki deneyin)');
        }
    }

    // !stop Komutu (Şarkıyı durdurmak istersen ekstra ekledim)
    if (komut === '!stop' || komut === '!durdur') {
        player.stop();
        return message.reply('🛑 Müzik durduruldu.');
    }
});

// Bot sesten düşerse geri bağlanma motoru
client.on('voiceStateUpdate', (oldState, newState) => {
    if (oldState.member && oldState.member.id === client.user.id && !newState.channelId) {
        suAnkiBaglanti = null;
        setTimeout(() => {
            const guild = client.guilds.cache.get(oldState.guild.id);
            if (guild) seseBaglan(SES_KANAL_ID, guild);
        }, 5000);
    }
});

client.login(TOKEN);

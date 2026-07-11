const { Client, GatewayIntentBits } = require('discord.js');

// Botun ihtiyaç duyduğu erişim izinleri (Intents)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Botun öneki (Prefix)
const prefix = ".";

// İstediğin ID'leri buraya sabitledik
const YETKILI_ROL_ID = "1404819891319476255";  // Bu komutu kullanabilecek rol
const VERILECEK_ROL_ID = "1519337018751193231"; // Kayıt olunca verilecek rol
const ALINACAK_ROL_ID = "1392602451567186001";  // Kayıt olunca alınacak rol (Kayıtsız rolü)

client.once('ready', () => {
    console.log(`${client.user.tag} olarak giriş yapıldı! Komutlar hazır.`);
});

client.on('messageCreate', async (message) => {
    // Mesaj botun önekiyle başlamıyorsa veya mesajı yazan bir botsa işlemi iptal et
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    // Komut ve argümanları ayırıyoruz (.k ID İsim Yaş)
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'k') {
        // 1. Yetki Kontrolü: Komutu kullanan kişide yetkili rolü var mı?
        if (!message.member.roles.cache.has(YETKILI_ROL_ID)) {
            return message.reply("Bu komutu kullanmak için gerekli yetkiye sahip değilsin!");
        }

        // Kullanımdan gelen argümanları alıyoruz
        const targetId = args[0]; // Kullanıcı ID'si
        const name = args[1];     // İsim
        const age = args[2];      // Yaş

        // Eksik argüman kontrolü
        if (!targetId || !name || !age) {
            return message.reply(`Hatalı kullanım! Doğru format: \`${prefix}k <Kullanıcı-ID> <İsim> <Yaş>\`\nÖrnek: \`${prefix}k 1234567890 Ahmet 18\``);
        }

        try {
            // Sunucudan hedef üyeyi ID ile buluyoruz
            const member = await message.guild.members.fetch(targetId);
            
            if (!member) {
                return message.reply("Belirttiğin ID'ye sahip bir üye sunucuda bulunamadı.");
            }

            // Yeni isim formatını ayarlıyoruz: "İsim | Yaş"
            const newNickname = `${name} | ${age}`;

            // 2. İsim Değiştirme
            await member.setNickname(newNickname);

            // 3. Rol Düzenleme (İstediğin rolü verme ve diğerini kaldırma)
            await member.roles.add(VERILECEK_ROL_ID);
            await member.roles.remove(ALINACAK_ROL_ID);

            // Başarılı mesajı
            return message.reply(`✅ **${member.user.tag}** kullanıcısı başarıyla kayıt edildi!\n• Yeni İsmi: \`${newNickname}\`\n• Verilen Rol: <@&${VERILECEK_ROL_ID}>\n• Alınan Rol: <@&${ALINACAK_ROL_ID}>`);

        } catch (error) {
            console.error(error);
            return message.reply("Kayıt işlemi sırasında bir hata oluştu! Botun rolleri yönetme yetkisinin tam olduğundan ve hedef üyenin üstünde bir rolde olduğundan emin ol.");
        }
    }
});

// Botunun tokenini buraya yapıştırmalısın
client.login(process.env.DISCORD_TOKEN);

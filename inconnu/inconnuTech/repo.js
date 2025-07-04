import config from '../../config.cjs';
import fetch from 'node-fetch';

const repo = async (m, sock) => {
  const prefix = config.PREFIX;
  const cmd = m.body.startsWith(prefix)
    ? m.body.slice(prefix.length).split(' ')[0].toLowerCase()
    : '';

  if (cmd === "repo") {
    await m.React('🚀');
    const repoUrl = 'https://github.com/INCONNU-BOY/INCONNU-XD-V2';
    const imageUrl = 'https://i.postimg.cc/BvY75gbx/IMG-20250625-WA0221.jpg';

    try {
      const apiUrl = `https://api.github.com/repos/INCONNU-BOY/INCONNU-XD-V2`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      // Get user name or fallback
      const contact = await sock.onWhatsApp(m.sender.split('@')[0]);
      const userName = (contact?.[0]?.notify || m.pushName || 'User').trim();

      if (data && data.forks_count !== undefined && data.stargazers_count !== undefined) {
        const menuText = `
🌟 *HELLO INCONNU XD V2 USER (${userName})* 👋
─────────────────────────────

💎 *INCONNU-XD V2 OFFICIAL REPOSITORY* 💎

🔗 *GitHub Link:* 
${repoUrl}

📊 *Live Repository Stats:*
⭐ Stars: *${data.stargazers_count}*
🍴 Forks: *${data.forks_count}*

🚀 *Why Choose INCONNU-XD V2?*
✅ Multi-Session Support
✅ Auto QR Mode
✅ Stylish UI & Animated Commands
✅ Easy Deploy & Maintain

🎥 *Watch Tutorial & Setup:*
https://www.youtube.com/@kingtech-y1q

─────────────────────────────
🔧 *BUILT WITH ❤️ BY INCONNU BOY*
─────────────────────────────
        `.trim();

        await sock.sendMessage(m.from, {
          image: { url: imageUrl },
          caption: menuText,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterName: "INCONNU-XD-V2",
              newsletterJid: "120363397722863547@newsletter",
            },
          },
        }, { quoted: m });

      } else {
        await sock.sendMessage(m.from, {
          text: '⚠️ GitHub repository data unavailable. Please try again later.',
          quoted: m
        });
      }

    } catch (error) {
      console.error("Repo fetch error:", error);
      await sock.sendMessage(m.from, {
        text: '🚨 Failed to load repository information.',
        quoted: m
      });
    } finally {
      await m.React('✅');
    }
  }
};

export default repo;

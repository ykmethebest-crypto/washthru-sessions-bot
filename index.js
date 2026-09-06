require("dotenv").config();

const {
    Client,
    GatewayIntentBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// ========================================
// NAVETY SETTINGS
// ========================================

const CHANNEL_ID = process.env.CHANNEL_ID;
const ROLE_ID = process.env.ROLE_ID;
const BUTTON_EMOJI = process.env.BUTTON_EMOJI;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const COMMAND_ROLE_ID = "1274143763891224668";

if (!DISCORD_TOKEN) {
    throw new Error("DISCORD_TOKEN is missing from the .env file");
}

const TIMEZONE = "Africa/Tunis";

// ========================================
// ANNOUNCEMENT TIMES
// ========================================

const ANNOUNCEMENT_TIMES = [
    "12:50",
    "15:50",
    "18:50",
    "21:50",
    "00:50",
    "03:50",
];

// ========================================
// COMMAND SETTINGS
// ========================================

const COMMAND_PREFIX = "!";

// ========================================
// EMBED CUSTOMIZATION
// ========================================

// Embed color
const EMBED_COLOR = "#3498DB";

// Embed title
const EMBED_TITLE = "Training Session";

// Embed message
const EMBED_MESSAGE = `<:washthru:1411100793624334398> | **Training Commencing**

Adorations, <@&1267585746840191101>

> Hey, everyone! A training session will be commencing at __xx:00__! Best of luck to all applying!

> If you wish to be pinged for training sessions, please head too "Channels & Roles" and pick up the "<@&1267585746840191101>" role./join`;

// ========================================
// BUTTON CUSTOMIZATION
// ========================================

// Button name
const BUTTON_NAME = "Training Center";

// Button color/style
//
// Options:
// ButtonStyle.Primary   = Blurple
// ButtonStyle.Secondary = Grey
// ButtonStyle.Success   = Green
// ButtonStyle.Danger    = Red
// ButtonStyle.Link      = Link button

const BUTTON_STYLE = ButtonStyle.Link;

// If using ButtonStyle.Link,
// put your link here.
const BUTTON_URL = "https://www.roblox.com/games/103101662477068/WashThru-Training-Center";


// ========================================
// SEND ANNOUNCEMENT
// ========================================

async function sendAnnouncement() {

    try {

        const channel = await client.channels.fetch(CHANNEL_ID);

        if (!channel) {
            console.log("Channel not found!");
            return;
        }

        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle(EMBED_TITLE)
            .setDescription(EMBED_MESSAGE)
            .setColor(EMBED_COLOR);

        // Create button
        const button = new ButtonBuilder()
            .setLabel(BUTTON_NAME)
            .setStyle(BUTTON_STYLE);

        // Add emoji (commented out - invalid emoji ID in config)
        // if (BUTTON_EMOJI) {
        //     button.setEmoji(BUTTON_EMOJI);
        // }

        // Link button needs a URL
        if (BUTTON_STYLE === ButtonStyle.Link) {
            button.setURL(BUTTON_URL);
        } else {
            // Required for non-link buttons
            button.setCustomId("navety_training_button");
        }

        // Put button underneath embed
        const row = new ActionRowBuilder()
            .addComponents(button);

        // Send everything
        await channel.send({
            content: `<@&${ROLE_ID}>`,
            embeds: [embed],
            components: [row],
            allowedMentions: {
                roles: [ROLE_ID]
            }
        });

        console.log("Navety training announcement sent!");

    } catch (error) {

        console.error("Error sending announcement:", error);

    }
}


// ========================================
// MESSAGE HANDLER
// ========================================

client.on("messageCreate", async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check if message starts with command prefix
    if (!message.content.startsWith(COMMAND_PREFIX)) return;

    // Extract command
    const args = message.content.slice(COMMAND_PREFIX.length).trim().split(/\s+/);
    const command = args[0].toLowerCase();

    // Check for !training command
    if (command === "training") {
        try {
            // Check if user has the required role
            if (!message.member.roles.cache.has(COMMAND_ROLE_ID)) {
                await message.reply({
                    content: `❌ You need the <@&${COMMAND_ROLE_ID}> role to use this command!`,
                    ephemeral: true
                });
                return;
            }

            // Send the announcement
            await sendAnnouncement();

            // Delete the command message
            await message.delete();

            console.log(`Training announcement posted by ${message.author.tag}`);

        } catch (error) {
            console.error("Error processing training command:", error);
            await message.reply({
                content: "❌ An error occurred while posting the announcement.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});


// ========================================
// TIME CHECKER (SCHEDULED ANNOUNCEMENTS)
// ========================================

let lastSent = "";

function getCurrentTime() {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).format(new Date());
}

function getCurrentDate() {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: TIMEZONE
    }).format(new Date());
}

function checkSchedule() {
    const currentTime = getCurrentTime();
    const currentDate = getCurrentDate();

    const currentKey = `${currentDate}-${currentTime}`;

    if (
        ANNOUNCEMENT_TIMES.includes(currentTime) &&
        lastSent !== currentKey
    ) {
        console.log(`Scheduled announcement matched: ${currentDate} ${currentTime} (${TIMEZONE})`);
        lastSent = currentKey;

        sendAnnouncement().catch((error) => {
            console.error("Scheduled announcement failed:", error);
        });
    }
}

// Check every 10 seconds
setInterval(checkSchedule, 10000);


// ========================================
// BOT READY
// ========================================

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Announcement times (${TIMEZONE}): ${ANNOUNCEMENT_TIMES.join(", ")}`);

    client.user.setStatus("idle");

    client.user.setActivity("WashThru Sessions", {
        type: 0
    });

    console.log("Navety Announcement Bot is ONLINE!");
    console.log(`Command: ${COMMAND_PREFIX}training (requires role ${COMMAND_ROLE_ID})`);
    checkSchedule();
});

client.login(DISCORD_TOKEN).catch((error) => {
    console.error("Discord login failed:", error.message);
});
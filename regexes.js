(function () {
    if (window.CIP_REGEXES) {
        return;
    }

    const stickerPlaceholderRegex = /\[([^\[\]]+?)\]/g;
    const bhlUserTextRegex = /^“(.*?)”$/gm;
    const bhlCharacterTextRegex = /^"(.*?)"$/gm;
    const bhlUserVoiceRegex = /^=(.*?)\|(.*?)=$/gm;
    const bhlCharacterVoiceRegex = /^=(.*?)\|(.*?)=$/gm;
    const unsplashPlaceholderRegex = /\[([^\[\]]+?)\.jpg\]/gi;

    const bhlPlaceholderDefinitions = [
        { type: 'userText', regex: bhlUserTextRegex, priority: 1 },
        { type: 'characterText', regex: bhlCharacterTextRegex, priority: 2 },
        { type: 'voice', regex: bhlUserVoiceRegex, priority: 3 },
    ];

    const allBhlRegexes = [
        bhlUserTextRegex,
        bhlCharacterTextRegex,
        bhlUserVoiceRegex,
        bhlCharacterVoiceRegex,
    ];

    window.CIP_REGEXES = {
        STICKERS: {
            PLACEHOLDER: stickerPlaceholderRegex,
        },
        BHL: {
            USER_TEXT: bhlUserTextRegex,
            CHARACTER_TEXT: bhlCharacterTextRegex,
            USER_VOICE: bhlUserVoiceRegex,
            CHARACTER_VOICE: bhlCharacterVoiceRegex,
            PLACEHOLDER_DEFINITIONS: bhlPlaceholderDefinitions,
            ALL_REGEXES: allBhlRegexes,
        },
        UNSPLASH: {
            PLACEHOLDER: unsplashPlaceholderRegex,
        },
    };

    window.BHL_PLACEHOLDER_DEFINITIONS = bhlPlaceholderDefinitions;
    window.ALL_BHL_REGEXES = allBhlRegexes;
})();

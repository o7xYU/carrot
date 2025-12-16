// Shared extension settings bridge
// Exposes the global SillyTavern extension_settings object so other modules can import it.
// Falls back to a plain object when window is unavailable.

const globalExtensionSettings =
    typeof window !== 'undefined'
        ? (window.extension_settings = window.extension_settings || {})
        : {};

export const extension_settings = globalExtensionSettings;

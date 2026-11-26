import { createContext, useContext } from "react";

/**
 * True when another page shows the game in a frame. Sign-in does not work there. The server CSP
 * limits which sites can frame the game.
 */
export const isFramed = (): boolean => typeof window !== "undefined" && window.self !== window.top;

/** A provider overrides the detection. Storybook needs one, because it shows each story in a frame. */
export const EmbeddedContext = createContext<boolean>(isFramed());

export const useIsEmbedded = (): boolean => useContext(EmbeddedContext);

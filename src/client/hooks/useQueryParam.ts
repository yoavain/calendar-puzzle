import { useEffect, useState } from "react";

// Pre-computed hash for the secret code
// Never store or expose the original value
const VALID_CODE_HASH = "6c58bc00fea09c8d7fdb97c7b58741ad37bd7ba8e5c76d35076e3b57071b172b";

const sha256 = async (message: string): Promise<string> => {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
};

export const useQueryParam = (param: string): boolean => {
    const [hasValidParam, setHasValidParam] = useState(false);

    useEffect(() => {
        const checkParam = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get(param);
            
            if (!code) {
                setHasValidParam(false);
                return;
            }

            const hashedCode = await sha256(code);
            setHasValidParam(hashedCode === VALID_CODE_HASH);
        };

        checkParam();
    }, [param]);

    return hasValidParam;
};

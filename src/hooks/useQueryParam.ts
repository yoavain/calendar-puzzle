import { useEffect, useState } from 'react';

// Pre-computed hash for the secret code
// Never store or expose the original value
const VALID_CODE_HASH = 'b4967e11a22aee03ffbca84ecf16bb4cd98e1357198ca52c79c523af70fea6ce';

async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export const useQueryParam = (param: string): boolean => {
    const [hasValidParam, setHasValidParam] = useState(false);

    useEffect(() => {
        const checkParam = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get(param);
            console.log('Checking code parameter:', code);
            
            if (!code) {
                console.log('No code parameter found');
                setHasValidParam(false);
                return;
            }

            const hashedCode = await sha256(code);
            console.log('Hashed code:', hashedCode);
            console.log('Expected hash:', VALID_CODE_HASH);
            console.log('Hash match:', hashedCode === VALID_CODE_HASH);
            setHasValidParam(hashedCode === VALID_CODE_HASH);
        };

        checkParam();
    }, [param]);

    return hasValidParam;
}; 
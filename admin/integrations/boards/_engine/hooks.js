// admin/integrations/boards/_engine/hooks.js
// useStore: re-render del componente cuando el store dispara notify().

import { useEffect, useState } from 'react';

export function useStore(store) {
    const [, force] = useState(0);
    useEffect(() => store.subscribe(() => force((n) => n + 1)), [store]);
    return store.getState();
}

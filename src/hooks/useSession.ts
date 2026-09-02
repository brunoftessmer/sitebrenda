"use client";

import { useCallback, useEffect, useState } from "react";

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  isAdmin: boolean;
} | null;

export function useSession() {
  const [user, setUser] = useState<SessionUser>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { user, loading, refresh };
}

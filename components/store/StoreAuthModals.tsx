"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { StoreRegisterModal } from "@/components/store/StoreRegisterModal";

type StoreAuthModalContextValue = {
  openRegister: () => void;
  closeRegister: () => void;
};

const StoreAuthModalContext = createContext<StoreAuthModalContextValue | null>(
  null,
);

export function useStoreAuthModals() {
  const ctx = useContext(StoreAuthModalContext);
  if (!ctx) {
    throw new Error("useStoreAuthModals debe usarse dentro de StoreAuthModalProvider");
  }
  return ctx;
}

export function StoreAuthModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [registerOpen, setRegisterOpen] = useState(false);

  const openRegister = useCallback(() => setRegisterOpen(true), []);
  const closeRegister = useCallback(() => setRegisterOpen(false), []);

  const onRegistered = useCallback(() => {
    setRegisterOpen(false);
    router.push("/cuenta");
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({ openRegister, closeRegister }),
    [openRegister, closeRegister],
  );

  return (
    <StoreAuthModalContext.Provider value={value}>
      {children}
      <StoreRegisterModal
        open={registerOpen}
        onClose={closeRegister}
        onRegistered={onRegistered}
      />
    </StoreAuthModalContext.Provider>
  );
}

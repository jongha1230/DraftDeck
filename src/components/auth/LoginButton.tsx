"use client";

import CustomButton from "@/components/ui/CustomButton";
import { createClient, hasBrowserSupabaseEnv } from "@/lib/supabase/client";
import { Chrome } from "lucide-react";
import { useState } from "react";

export default function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const isConfigured = hasBrowserSupabaseEnv();

  const handleLogin = async () => {
    const supabase = createClient();
    if (!supabase) return;

    setIsLoading(true);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : "",
      },
    });
  };

  return (
    <CustomButton
      onClick={handleLogin}
      variant="primary"
      className="w-full justify-center gap-2 px-5"
      loading={isLoading}
      disabled={!isConfigured}
    >
      <Chrome size={16} />
      Google 로그인
    </CustomButton>
  );
}

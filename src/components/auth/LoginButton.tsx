"use client";

import CustomButton from "@/components/ui/CustomButton";
import { createClient } from "@/lib/supabase/client";
import { Chrome } from "lucide-react";
import { useState } from "react";

export default function LoginButton() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
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
    >
      <Chrome size={16} />
      Google 로그인
    </CustomButton>
  );
}

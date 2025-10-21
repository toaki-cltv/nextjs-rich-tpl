"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { Skeleton } from "../shadcn/skeleton";
import { ClientOnly } from "./client-only";

export function ColorModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleColorMode = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const newTheme = theme === "light" ? "dark" : "light";

    // View Transitions API のサポートチェック
    if (
      !document.startViewTransition ||
      !event.currentTarget ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setTheme(newTheme);
      return;
    }

    // クリック位置を取得
    const x = event.clientX;
    const y = event.clientY;

    // 画面の端までの最大距離を計算（円の半径）
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    // View Transition を開始
    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
    });

    // アニメーション用のクリップパスを適用
    try {
      await transition.ready;

      // 常に新しいテーマ (::view-transition-new) が円形に広がる
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );

      await transition.finished;
    } finally {
      // クリーンアップ（data属性は使わなくなったので削除）
    }
  };

  return (
    <ClientOnly fallback={<Skeleton className="w-6 h-6" />}>
      <button
        aria-label="toggle color mode"
        className="flex justify-center items-center w-6 h-6 transition-transform hover:scale-110 active:scale-95"
        onClick={toggleColorMode}
        suppressContentEditableWarning
        suppressHydrationWarning
      >
        {theme === "light" ? <IconMoon /> : <IconSun />}
      </button>
    </ClientOnly>
  );
}

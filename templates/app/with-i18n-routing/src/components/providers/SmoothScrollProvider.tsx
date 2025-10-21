"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Lenisインスタンスを作成
    const lenis = new Lenis({
      duration: 1.2, // スクロールの持続時間 (秒)
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // イージング関数
      orientation: "vertical", // 縦スクロール
      gestureOrientation: "vertical", // ジェスチャーの向き
      smoothWheel: true, // マウスホイールをスムーズに
      wheelMultiplier: 1, // ホイールの速度倍率
      touchMultiplier: 2, // タッチの速度倍率
      infinite: false, // 無限スクロール
    });

    // アニメーションフレームでLenisを更新
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // クリーンアップ
    return () => {
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

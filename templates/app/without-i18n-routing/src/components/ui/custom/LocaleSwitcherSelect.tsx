"use client";

import clsx from "clsx";
import { ReactNode, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/shadcn/select";
import { Locale, setUserLocale } from "@/services/locale";

type Props = {
  children: ReactNode;
  defaultValue: string;
  label: string;
};

export default function LocaleSwitcherSelect({
  children,
  defaultValue,
  label,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(val: string) {
    const nextLocale = val as Locale;
    startTransition(() => {
      setUserLocale(nextLocale);
      router.refresh();
    });
  }

  return (
    <div
      suppressHydrationWarning
      className={clsx(
        "inline-flex items-center",
        isPending && "transition-opacity opacity-50 pointer-events-none",
      )}
    >
      <span className="sr-only">{label}</span>
      <Select
        defaultValue={defaultValue}
        onValueChange={onSelectChange}
        disabled={isPending}
      >
        <SelectTrigger className="h-8 text-xs font-medium w-auto min-w-[80px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

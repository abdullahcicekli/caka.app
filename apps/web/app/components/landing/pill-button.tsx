import { cva, type VariantProps } from "class-variance-authority";
import { Link } from "react-router";
import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/** Hap biçimli CTA. Renk kararları varyantta kalır; çağıran yalnızca niyet seçer. */
const pillVariants = cva(
  "inline-flex items-center justify-center rounded-full px-6 py-3 text-base font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      variant: {
        /** Navbar birincil CTA'sı: mürekkep zemin */
        ink: "bg-murekkep text-white hover:bg-murekkep/85",
        /** Navbar ikincil: zemin tonunda yumuşak hap */
        soft: "bg-zemin text-murekkep hover:bg-sinir",
        /** Lime blok üzerindeki birincil CTA: koyu zeytin zemin */
        heroDark: "bg-kirec-koyu text-white hover:bg-kirec-koyu/90",
        /** Mavi blok üzerindeki CTA: kireç zemin */
        lime: "bg-kirec text-murekkep hover:bg-kirec/90",
      },
    },
    defaultVariants: { variant: "ink" },
  },
);

type PillVariants = VariantProps<typeof pillVariants>;

export function PillLink({
  className,
  variant,
  ...props
}: ComponentProps<typeof Link> & PillVariants) {
  return <Link className={cn(pillVariants({ variant }), className)} {...props} />;
}

export function PillButton({
  className,
  variant,
  ...props
}: ComponentProps<"button"> & PillVariants) {
  return <button className={cn(pillVariants({ variant }), className)} {...props} />;
}

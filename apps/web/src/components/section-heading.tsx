import Link from "next/link";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h2 className="display-title text-2xl md:text-[30px]">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-[12px] leading-6 text-muted">{description}</p>}
      </div>
      {href && action && (
        <Link prefetch={false} href={href} className="shrink-0 text-[11px] text-teal transition-colors hover:text-copper">
          {action} →
        </Link>
      )}
    </div>
  );
}

/**
 * Native POST so sign-out works before hydration and the browser applies
 * Set-Cookie as part of the navigation (no router cache, no swallowed click).
 */
export default function SignOutForm({
  label,
  className,
  buttonClassName,
}: {
  label: string;
  className?: string;
  buttonClassName?: string;
}) {
  return (
    <form method="post" action="/api/auth/logout" className={className ?? "inline"}>
      <input type="hidden" name="nav" value="1" />
      <button type="submit" data-sign-out="" className={buttonClassName}>
        {label}
      </button>
    </form>
  );
}

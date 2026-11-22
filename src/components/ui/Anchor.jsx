import { Link } from "react-router-dom";

export function Anchor({ to, children, ...props }) {
  return (
    <Link to={to} {...props}>
      {children}
    </Link>
  );
}
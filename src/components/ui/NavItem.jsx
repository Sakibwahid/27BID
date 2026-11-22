import React from "react";
import { Link } from "react-router-dom";

export function NavItem({ label, link, Icon, onClick }) {
  const isAction = !link || link === "#";

  const content = (
    <>
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </>
  );

  const className =
    "flex items-center gap-3 w-full py-2 text-fifa-text-secondary hover:text-fifa-accent transition duration-300";

  if (isAction) {
    return (
      <ol>
        <button type="button" className={className} onClick={onClick}>
          {content}
        </button>
      </ol>
    );
  }

  return (
    <ol type="">
      <Link to={link} className={className} onClick={onClick}>
        {content}
      </Link>
    </ol>
  );
}

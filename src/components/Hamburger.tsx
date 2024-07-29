import React from "react";
import { cn } from "~/utils/helpers";

const Hamburger = ({ open, action }: { open: boolean; action: () => void }) => {
  return (
    <div
      className={cn("hamburger", { active: open })}
      id="hamburger"
      onClick={action}
    >
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
};

export default Hamburger;

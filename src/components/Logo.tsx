import { Link } from "react-router-dom";
import { HardHat } from "lucide-react";

export function Logo({ variant = "dark" }: { variant?: "dark" | "light" }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm group-hover:scale-105 transition-transform">
        <HardHat className="h-5 w-5" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={`display-md text-lg ${
            variant === "light" ? "text-trust-foreground" : "text-foreground"
          }`}
        >
          FieldHands
        </span>
      </div>
    </Link>
  );
}

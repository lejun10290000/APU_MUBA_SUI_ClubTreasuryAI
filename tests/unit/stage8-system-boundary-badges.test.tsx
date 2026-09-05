import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import { SystemBoundaryBadges } from "@/src/components/system-boundary-badges";

it("renders the four explanatory system boundaries", () => {
  render(<SystemBoundaryBadges />);
  expect(screen.getByText("Gemini AI")).toBeInTheDocument();
  expect(screen.getByText("Deterministic Rule")).toBeInTheDocument();
  expect(screen.getByText("Human Decision")).toBeInTheDocument();
  expect(screen.getByText("Sui On-chain")).toBeInTheDocument();
});

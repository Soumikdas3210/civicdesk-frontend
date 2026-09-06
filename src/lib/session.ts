import type { Role } from "./roles";

 
export const CURRENT_ROLE: Role = "citizen";

export const CURRENT_USER = {
  name: "Rina Akter",
  role: CURRENT_ROLE,
};

export function useCurrentRole(): Role {
  return CURRENT_ROLE;
}
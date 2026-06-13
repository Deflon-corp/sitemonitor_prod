import { SELECTED_DOMAIN_KEY } from "../layouts/Sidebar";

export function useQaDomainId() {
  return sessionStorage.getItem(SELECTED_DOMAIN_KEY);
}

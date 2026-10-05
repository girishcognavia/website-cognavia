// Which product is pointed at in the Home products section. Shared by the card art (lifts
// the card) and the product list (re-renders via useSyncExternalStore).
import { useSyncExternalStore } from "react";

let active = -1;
const listeners = new Set<() => void>();

export const productStore = {
  get: () => active,
  set(i: number) {
    if (i === active) return;
    active = i;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useActiveProduct() {
  return useSyncExternalStore(productStore.subscribe, productStore.get, () => -1);
}

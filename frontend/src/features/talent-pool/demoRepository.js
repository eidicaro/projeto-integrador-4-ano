import { uniqueInterests, validateInterests } from "./talentPool.js";

export const MEMBERSHIP_EVENT = "point:talent-membership";
const PREFIX = "point:talent-pool:demo:v1:";

/** Explicit integration boundary: replace this adapter with the membership API
 * once the server supports opt-in/opt-out. Only preferences are stored here;
 * contact details, resumes and photos never enter browser storage.
 * Recruiters never read another account's local preferences.
 */
export function createDemoRepository(
  storage,
  now = () => new Date().toISOString(),
) {
  function key(userId) {
    if (userId === null || userId === undefined || String(userId) === "")
      throw new Error("Conta necessária.");
    return PREFIX + String(userId);
  }
  return {
    get(userId) {
      const raw = storage.getItem(key(userId));
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (
        value?.userId !== String(userId) ||
        !Array.isArray(value.interests) ||
        value.interests.some((area) => typeof area !== "string") ||
        validateInterests(value.interests) ||
        Number.isNaN(Date.parse(value.joinedAt)) ||
        Number.isNaN(Date.parse(value.updatedAt))
      ) {
        throw new Error("Preferências locais inválidas.");
      }
      return value;
    },
    save(userId, values) {
      const interests = uniqueInterests(values);
      const error = validateInterests(interests);
      if (error) throw new Error(error);
      const previous = this.get(userId);
      const timestamp = now();
      const membership = {
        userId: String(userId),
        interests,
        joinedAt: previous?.joinedAt || timestamp,
        updatedAt: timestamp,
      };
      storage.setItem(key(userId), JSON.stringify(membership));
      return membership;
    },
    leave(userId) {
      storage.removeItem(key(userId));
    },
  };
}

export function getDemoRepository() {
  return createDemoRepository(window.localStorage);
}

export function notifyMembershipChange() {
  window.dispatchEvent(new Event(MEMBERSHIP_EVENT));
}

import test from "node:test";
import assert from "node:assert/strict";
import { createDemoRepository } from "../src/features/talent-pool/demoRepository.js";
import { getDemoTalents } from "../src/features/talent-pool/demoTalents.js";
import {
  filterTalents,
  interestOptions,
  profileCompleteness,
  validateInterests,
} from "../src/features/talent-pool/talentPool.js";

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
    values,
  };
}
const now = Date.parse("2026-10-02T12:00:00Z");
const talents = getDemoTalents(now);

test("membership persists across adapter instances and remains isolated by account", () => {
  const storage = memoryStorage();
  const repo = createDemoRepository(storage, () => new Date(now).toISOString());
  assert.equal(repo.get(1), null);
  repo.save(1, ["Desenvolvimento", " desenvolvimento ", "Dados"]);
  assert.deepEqual(createDemoRepository(storage).get(1).interests, [
    "Desenvolvimento",
    "Dados",
  ]);
  assert.equal(repo.get(2), null);
  assert.deepEqual(Object.keys(repo.get(1)).sort(), [
    "interests",
    "joinedAt",
    "updatedAt",
    "userId",
  ]);
});

test("updates preserve entry date and leaving removes only the selected account", () => {
  const storage = memoryStorage();
  let timestamp = "2026-10-01T12:00:00Z";
  const repo = createDemoRepository(storage, () => timestamp);
  repo.save(1, ["Dados"]);
  repo.save(2, ["Suporte"]);
  timestamp = "2026-10-02T12:00:00Z";
  const updated = repo.save(1, ["Design"]);
  assert.equal(updated.joinedAt, "2026-10-01T12:00:00Z");
  assert.equal(updated.updatedAt, timestamp);
  repo.leave(1);
  assert.equal(repo.get(1), null);
  assert.ok(repo.get(2));
});

test("empty, overlong, excessive interests, corrupt storage and storage failures are rejected", () => {
  const storage = memoryStorage();
  const repo = createDemoRepository(storage);
  assert.throws(() => repo.save(1, []));
  assert.throws(() => repo.save(1, ["x".repeat(121)]));
  assert.ok(
    validateInterests(Array.from({ length: 9 }, (_, i) => `Área ${i}`)),
  );
  repo.save(1, ["Dados"]);
  storage.setItem([...storage.values.keys()][0], "{bad");
  assert.throws(() => repo.get(1));
  assert.throws(() =>
    createDemoRepository({
      getItem() {
        throw new Error("Denied");
      },
    }).get(1),
  );
});

test("suggestions reuse real departments, resume area and previous interests without duplicate accents", () => {
  assert.deepEqual(
    interestOptions(
      [{ department: "Desenvolvimento" }, { department: "desenvolvimento" }],
      { area_atuacao: "Dados" },
      { interests: ["Suporte"] },
    ),
    ["Dados", "Desenvolvimento", "Suporte"],
  );
  assert.deepEqual(interestOptions([], null, null), []);
});

test("search matches accents, multiple words, technologies and desired roles", () => {
  assert.equal(
    filterTalents(talents, { query: "SAO react" }, now)[0].name,
    "Marina Alves",
  );
  assert.equal(
    filterTalents(talents, { query: "analista dados" }, now)[0].name,
    "Lucas Ferreira",
  );
  assert.equal(
    filterTalents(talents, { query: "spring" }, now)[0].name,
    "Pedro Lima",
  );
  assert.equal(filterTalents(talents, { query: "zzzz" }, now).length, 0);
});

test("combined area, location and date filters work; sorting does not mutate source", () => {
  assert.equal(
    filterTalents(
      talents,
      { area: "Tecnologia", location: "São Paulo, SP", period: "7" },
      now,
    ).length,
    1,
  );
  assert.equal(filterTalents(talents, { period: "30" }, now).length, 3);
  assert.equal(
    filterTalents(talents, { sort: "name" }, now)[0].name,
    "Beatriz Costa",
  );
  assert.equal(
    filterTalents(talents, { sort: "oldest" }, now)[0].name,
    "Pedro Lima",
  );
  assert.equal(
    filterTalents(talents, { sort: "recent" }, now)[0].name,
    "Marina Alves",
  );
  assert.equal(talents[0].name, "Marina Alves");
});

test("completeness reflects actual available profile data", () => {
  assert.equal(profileCompleteness(null, {}).percent, 0);
  assert.equal(
    profileCompleteness(null, { name: "Teste", email: "test@example.invalid" })
      .percent,
    25,
  );
  assert.ok(profileCompleteness(talents[0].resume).percent > 25);
});

import { sleep } from "workflow";

export async function countToN(target: number): Promise<{
  total: number;
  stepsRun: number;
}> {
  "use workflow";

  let total = 0;
  let stepsRun = 0;
  for (let i = 1; i <= target; i++) {
    const added = await addOne(total);
    total = added;
    stepsRun += 1;
    await sleep("2s");
  }
  return { total, stepsRun };
}

async function addOne(current: number): Promise<number> {
  "use step";
  return current + 1;
}

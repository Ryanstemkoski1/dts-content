import { AnalyticsProcess } from './analytics';
import { EntityProcess } from './entity';

const processes = [
  new AnalyticsProcess(),
  new EntityProcess(),
];

export const startProcesses = async ():Promise<void> => {
  await Promise.all(
    processes.map(p => p.start()),
  );
};

export const endProcesses = async ():Promise<void> => {
  await Promise.all(
    processes.map(p => p.end()),
  );
};

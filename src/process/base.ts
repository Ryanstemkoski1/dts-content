export interface IProcess {
  start():Promise<void>;
  end():Promise<void>;
}

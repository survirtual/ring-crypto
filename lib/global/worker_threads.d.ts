// declare module "worker_threads" {
//   import { Writable, Readable } from "stream";
//     export var isMainThread: boolean
//     export var parentPort: null | MessagePort
//     export var threadId: number
//     export var threadId: number
//     export var workerData: any
  
//     export interface Worker {
//       readonly threadId: number
//       readonly stdin: Writable | null
//       readonly stdout: Readable
//       readonly stderr: Readable
  
//       postMessage(value: any, transferList?: object[]): void;
//       terminate(callback?: Function) :void
  
//       ref() :void
//       unref() :void
  
//       /**
//        * events.EventEmitter
//        * 1. online
//        * 2. message
//        * 3. error
//        * 4. exit
//        */
//       addListener(event: string, listener: (...args: any[]) => void): this;
//       addListener(event: "online", listener: () => void): this;
//       addListener(event: "message", listener: (value: any) => void): this;
//       addListener(event: "error", listener: (err: Error) => void): this;
//       addListener(event: "exit", listener: (exitCode: number) => void): this;
  
//       emit(event: string | symbol, ...args: any[]): boolean;
//       emit(event: "online"): boolean;
//       emit(event: "message", value: any): boolean;
//       emit(event: "error", err: Error): boolean;
//       emit(event: "exit", exitCode: number): boolean;
  
//       on(event: string, listener: (...args: any[]) => void): this;
//       on(event: "online", listener: () => void): this;
//       on(event: "message", listener: (value: any) => void): this;
//       on(event: "error", listener: (err: Error) => void): this;
//       on(event: "exit", listener: (exitCode: number) => void): this;
  
//       once(event: string, listener: (...args: any[]) => void): this;
//       once(event: "online", listener: () => void): this;
//       once(event: "message", listener: (value: any) => void): this;
//       once(event: "error", listener: (err: Error) => void): this;
//       once(event: "exit", listener: (exitCode: number) => void): this;
  
//       prependListener(event: string, listener: (...args: any[]) => void): this;
//       prependListener(event: "online", listener: () => void): this;
//       prependListener(event: "message", listener: (value: any) => void): this;
//       prependListener(event: "error", listener: (err: Error) => void): this;
//       prependListener(event: "exit", listener: (exitCode: number) => void): this;
  
//       prependOnceListener(event: string, listener: (...args: any[]) => void): this;
//       prependOnceListener(event: "online", listener: () => void): this;
//       prependOnceListener(event: "message", listener: (value: any) => void): this;
//       prependOnceListener(event: "error", listener: (err: Error) => void): this;
//       prependOnceListener(event: "exit", listener: (exitCode: number) => void): this;
//     }
//     export interface WorkerOptions {
//       eval?: boolean
//       workerData?: any
//       stdin?: boolean
//       stdout?: boolean
//       stderr?: boolean
//     }
//     export var Worker: {
//       new(filename: string, options?: WorkerOptions): Worker;
//     }
  
//     // new Worker(filename[, options])
//     export class MessageChannel {
//       readonly port1: MessagePort
//       readonly port2: MessagePort
//     }
  
//     export class MessagePort extends NodeJS.EventEmitter {
  
//       start() :void
//       close() :void
  
//       postMessage(value: any, transferList?: Object[]) :void
  
//       ref() :void
//       unref() :void
      
//       /**
//        * events.EventEmitter
//        * 1. close
//        * 2. message
//        */
//       addListener(event: string, listener: (...args: any[]) => void): this;
//       addListener(event: "close", listener: () => void): this;
//       addListener(event: "message", listener: (value: any) => void): this;
  
//       emit(event: string | symbol, ...args: any[]): boolean;
//       emit(event: "close"): boolean;
//       emit(event: "message", value: any): boolean;
  
//       on(event: string, listener: (...args: any[]) => void): this;
//       on(event: "close", listener: () => void): this;
//       on(event: "message", listener: (value: any) => void): this;
  
//       once(event: string, listener: (...args: any[]) => void): this;
//       once(event: "close", listener: () => void): this;
//       once(event: "message", listener: (value: any) => void): this;
  
//       prependListener(event: string, listener: (...args: any[]) => void): this;
//       prependListener(event: "close", listener: () => void): this;
//       prependListener(event: "message", listener: (value: any) => void): this;
  
//       prependOnceListener(event: string, listener: (...args: any[]) => void): this;
//       prependOnceListener(event: "close", listener: () => void): this;
//       prependOnceListener(event: "message", listener: (value: any) => void): this;
//     }
//   }
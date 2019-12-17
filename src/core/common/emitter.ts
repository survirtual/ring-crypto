export type EmitterCallback = (...args: any[]) => void;

export class Emitter {

    private handlers: {
        [event: string]: EmitterCallback[]
    } = {};

    public on(ev: string, cb: EmitterCallback) {
        const handlers = this.handlers[ev] || [];
        this.handlers[ev] = handlers;

        const found = handlers.findIndex((handler) => {
            return handler === cb;
        });

        if (found > -1) {
            return;
        }

        handlers.push(cb);
    }

    public once(ev: string, cb: EmitterCallback) {
        const handlers = this.handlers[ev] || [];
        this.handlers[ev] = handlers;

        const self = this;
        const onceCb = (...args: any[]) => {
            try {
                cb(...args);
            } catch (e) {
                self.off(ev, onceCb);
                throw e;
            }
        };

        this.on(ev, onceCb);
    }

    public off(ev: string, cb: EmitterCallback) {
        const handlers = this.handlers[ev];

        if (handlers == null) {
            return;
        }

        const found = handlers.findIndex((handler) => {
            return handler === cb;
        });

        if (found === -1) {
            return;
        }

        handlers.splice(found, 1);

        if (handlers.length === 0) {
            delete this.handlers[ev];
        }
    }

    public emit(ev: string, ...args: any[]) {
        const handlers = this.handlers[ev];
        if (handlers == null) {
            return;
        }

        for (const handler of handlers) {
            try {
                handler(...args);
            } catch (e) {}
        }
    }
}

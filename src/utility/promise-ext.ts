type CallbackFunc = (err: Error, ...par: any[]) => void;
type CallbackWrapperFunc = (callback: CallbackFunc) => void;

// Static Extensions
interface PromiseConstructor {
    fromCallback: <T>(cb: CallbackWrapperFunc) => Promise<T>;
}

Promise.fromCallback = <T>(cb: CallbackWrapperFunc): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        cb((err: Error, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  };

// Instance Extensions
interface Promise<T> {
    toCallback: (cb: CallbackFunc) => void;
}

Promise.prototype.toCallback = function(cb: CallbackFunc) {
    this
    .then((res) => {
      if (cb) {
        cb(null, res);
      }
    })
    .catch((err) => {
      if (cb) {
        cb(err);
      }
    });
};

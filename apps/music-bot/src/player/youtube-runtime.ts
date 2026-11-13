import { Platform } from "youtubei.js";
import { getQuickJS, shouldInterruptAfterDeadline } from "quickjs-emscripten";

// Execute provider decipher code in a bounded WASM VM with no host filesystem or network.
Platform.shim.eval = async (data, env) => {
  const vm = (await getQuickJS()).newContext();
  vm.runtime.setMemoryLimit(16 * 1024 * 1024);
  vm.runtime.setInterruptHandler(
    shouldInterruptAfterDeadline(Date.now() + 1000),
  );
  try {
    const bindings = Object.entries(env)
      .map(([name, value]) => `var ${name}=${JSON.stringify(value)};`)
      .join("\n");
    const result = vm.evalCode(`${bindings}\n${data.output}`);
    const handle = vm.unwrapResult(result);
    try {
      return vm.dump(handle);
    } finally {
      handle.dispose();
    }
  } finally {
    vm.dispose();
  }
};

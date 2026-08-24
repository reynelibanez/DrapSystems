import * as React from "react";
export const IX3Context = React.createContext({
  registerIX3: null,
});
async function loadAndCreateIX3Engine() {
  await import("./devlink-gsap");
  const { createIX3Engine } = await import("./devlink-ix3");
  return createIX3Engine();
}
export const IX3Provider = ({ children }) => {
  const engineRef = React.useRef(null);
  const queueRef = React.useRef([]);
  const initStartedRef = React.useRef(false);
  const destroyedRef = React.useRef(false);
  const ensureEngine = React.useCallback(() => {
    if (initStartedRef.current) return;
    initStartedRef.current = true;
    loadAndCreateIX3Engine().then((engine) => {
      if (destroyedRef.current) {
        engine.destroy();
        return;
      }
      engineRef.current = engine;
      for (const data of queueRef.current) {
        engine.register(data.interactions, data.timelines);
      }
      queueRef.current = [];
    });
  }, []);
  React.useEffect(() => {
    destroyedRef.current = false;
    return () => {
      destroyedRef.current = true;
      engineRef.current?.destroy();
    };
  }, []);
  const registerIX3 = React.useCallback(
    (data) => {
      ensureEngine();
      if (engineRef.current) {
        engineRef.current.register(data.interactions, data.timelines);
      } else {
        queueRef.current.push(data);
      }
    },
    [ensureEngine]
  );
  return React.createElement(
    IX3Context.Provider,
    { value: { registerIX3 } },
    children
  );
};
export const useIX3Interactions = (data) => {
  const { registerIX3 } = React.useContext(IX3Context);
  const registeredRef = React.useRef(false);
  React.useEffect(() => {
    if (registeredRef.current || !registerIX3) return;
    registeredRef.current = true;
    registerIX3(data);
  }, [registerIX3, data]);
};

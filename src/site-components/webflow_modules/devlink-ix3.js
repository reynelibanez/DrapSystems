/*!
 * Webflow: Front-end site library
 * @license MIT
 * Inline scripts may access the api using an async handler:
 *   var Webflow = Webflow || [];
 *   Webflow.push(readyFunction);
 */

var vo = Object.create;
var rt = Object.defineProperty;
var bo = Object.getOwnPropertyDescriptor;
var To = Object.getOwnPropertyNames;
var wo = Object.getPrototypeOf,
  Co = Object.prototype.hasOwnProperty;
var So = (n, e, t) =>
  e in n
    ? rt(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t })
    : (n[e] = t);
var m = (n, e) => () => (e || n((e = { exports: {} }).exports, e), e.exports);
var Eo = (n, e, t, r) => {
  if ((e && typeof e == "object") || typeof e == "function")
    for (let o of To(e))
      !Co.call(n, o) &&
        o !== t &&
        rt(n, o, {
          get: () => e[o],
          enumerable: !(r = bo(e, o)) || r.enumerable,
        });
  return n;
};
var tr = (n, e, t) => (
  (t = n != null ? vo(wo(n)) : {}),
  Eo(
    e || !n || !n.__esModule
      ? rt(t, "default", { value: n, enumerable: !0 })
      : t,
    n
  )
);
var fe = (n, e, t) => (So(n, typeof e != "symbol" ? e + "" : e, t), t);
var rr = m((lt) => {
  "use strict";
  Object.defineProperty(lt, "__esModule", { value: !0 });
  function Mo(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Mo(lt, {
    CORE_OPERATORS: function () {
      return st;
    },
    DEFAULTS: function () {
      return at;
    },
    DEFAULT_CUSTOM_EASE: function () {
      return Io;
    },
    EASE_DEFAULTS: function () {
      return nr;
    },
    RELATIONSHIP_TYPES: function () {
      return ct;
    },
    STANDARD_TRIGGER_ALLOWED_CONTROLS: function () {
      return Ro;
    },
    TimelineControlType: function () {
      return it;
    },
    TweenType: function () {
      return ot;
    },
    isValidControlType: function () {
      return Ao;
    },
    tweenTypeFromName: function () {
      return Oo;
    },
    tweenTypeToName: function () {
      return _o;
    },
  });
  var it;
  (function (n) {
    (n.STANDARD = "standard"),
      (n.SCROLL = "scroll"),
      (n.LOAD = "load"),
      (n.CONTINUOUS = "continuous");
  })(it || (it = {}));
  function Ao(n) {
    return (
      n === "standard" || n === "scroll" || n === "load" || n === "continuous"
    );
  }
  var ot;
  (function (n) {
    (n[(n.To = 0)] = "To"),
      (n[(n.From = 1)] = "From"),
      (n[(n.FromTo = 2)] = "FromTo"),
      (n[(n.Set = 3)] = "Set");
  })(ot || (ot = {}));
  function Oo(n) {
    switch (n) {
      case "to":
        return 0;
      case "from":
        return 1;
      case "both":
        return 2;
      case "set":
        return 3;
    }
  }
  function _o(n) {
    switch (n) {
      case 0:
        return "to";
      case 1:
        return "from";
      case 2:
        return "both";
      case 3:
        return "set";
      default:
        return null;
    }
  }
  var st;
  (function (n) {
    (n.AND = "wf:and"), (n.OR = "wf:or");
  })(st || (st = {}));
  var at;
  (function (n) {
    n[(n.DURATION = 0.5)] = "DURATION";
  })(at || (at = {}));
  var ct;
  (function (n) {
    (n.NONE = "none"),
      (n.WITHIN = "within"),
      (n.DIRECT_CHILD_OF = "direct-child-of"),
      (n.CONTAINS = "contains"),
      (n.DIRECT_PARENT_OF = "direct-parent-of"),
      (n.NEXT_TO = "next-to"),
      (n.NEXT_SIBLING_OF = "next-sibling-of"),
      (n.PREV_SIBLING_OF = "prev-sibling-of");
  })(ct || (ct = {}));
  var nr = {
      back: { type: "back", curve: "out", power: 1.7 },
      elastic: { type: "elastic", curve: "out", amplitude: 1, period: 0.3 },
      steps: { type: "steps", stepCount: 6 },
      rough: {
        type: "rough",
        templateCurve: "none.inOut",
        points: 20,
        strength: 1,
        taper: "none",
        randomizePoints: !0,
        clampPoints: !1,
      },
      slowMo: { type: "slowMo", linearRatio: 0.7, power: 0.7, yoyoMode: !1 },
      expoScale: {
        type: "expoScale",
        startingScale: 0.05,
        endingScale: 1,
        templateCurve: "none.inOut",
      },
      customWiggle: {
        type: "customWiggle",
        wiggles: 10,
        wiggleType: "easeOut",
      },
      customBounce: {
        type: "customBounce",
        strength: 0.7,
        squash: 1,
        endAtStart: !1,
      },
      customEase: {
        type: "customEase",
        bezierCurve: "M0,160 C40,160 24,96 80,96 136,96 120,0 160,0",
      },
    },
    Io = nr.back,
    Ro = [
      "restart",
      "play",
      "reverse",
      "reverseFlipEase",
      "pause",
      "resume",
      "togglePlayReverse",
      "stop",
      "none",
    ];
});
var ir = m((ut) => {
  "use strict";
  Object.defineProperty(ut, "__esModule", { value: !0 });
  Object.defineProperty(ut, "RuntimeBuilder", {
    enumerable: !0,
    get: function () {
      return xo;
    },
  });
  var xo = class {
    baseInfo;
    extensions = [];
    lifecycle = {};
    constructor(e) {
      this.baseInfo = e;
    }
    addTrigger(e, t) {
      let r = `${this.baseInfo.namespace}:${e}`;
      return (
        this.extensions.push({
          extensionPoint: "trigger",
          id: r,
          triggerType: r,
          implementation: t,
        }),
        this
      );
    }
    addAction(e, t) {
      let r = `${this.baseInfo.namespace}:${e}`;
      return (
        this.extensions.push({
          extensionPoint: "action",
          id: r,
          actionType: r,
          implementation: t,
        }),
        this
      );
    }
    addTargetResolver(e, t) {
      let r = `${this.baseInfo.namespace}:${e}`;
      return (
        this.extensions.push({
          extensionPoint: "targetResolver",
          id: r,
          resolverType: r,
          implementation: t,
        }),
        this
      );
    }
    addCondition(e, t) {
      let r = `${this.baseInfo.namespace}:${e}`;
      return (
        this.extensions.push({
          extensionPoint: "condition",
          id: r,
          conditionType: r,
          implementation: t,
        }),
        this
      );
    }
    onInitialize(e) {
      return (this.lifecycle.initialize = e), this;
    }
    onActivate(e) {
      return (this.lifecycle.activate = e), this;
    }
    onDeactivate(e) {
      return (this.lifecycle.deactivate = e), this;
    }
    onDispose(e) {
      return (this.lifecycle.dispose = e), this;
    }
    createManifest() {
      let e = this.extensions.map((t) => `${t.extensionPoint}:${t.id}`);
      return {
        id: [this.baseInfo.namespace, this.baseInfo.pluginId],
        version: this.baseInfo.version,
        name: this.baseInfo.displayName || this.baseInfo.pluginId,
        description: this.baseInfo.description || "",
        dependencies: this.baseInfo.dependencies,
        features: e,
      };
    }
    buildRuntime() {
      return {
        manifest: this.createManifest(),
        extensions: this.extensions,
        ...this.lifecycle,
      };
    }
  };
});
var cr = m((dt) => {
  "use strict";
  Object.defineProperty(dt, "__esModule", { value: !0 });
  function Po(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Po(dt, {
    ConditionCategoryBuilder: function () {
      return ar;
    },
    DesignBuilder: function () {
      return Fo;
    },
    TargetCategoryBuilder: function () {
      return or;
    },
    TriggerCategoryBuilder: function () {
      return sr;
    },
  });
  var ko = class {
      categoryBuilder;
      groupConfig;
      properties;
      constructor(e, t) {
        (this.categoryBuilder = e),
          (this.groupConfig = t),
          (this.properties = []);
      }
      addProperty(e, t, r) {
        return (
          this.properties.push({
            id: e,
            schema: { ...t, description: r?.description || t.description },
          }),
          this
        );
      }
      addGroup(e) {
        return (
          this.categoryBuilder.finalizeGroup({
            ...this.groupConfig,
            properties: this.properties,
          }),
          this.categoryBuilder.clearCurrentGroupBuilder(),
          this.categoryBuilder.addGroup(e)
        );
      }
      getGroupData() {
        return { ...this.groupConfig, properties: this.properties };
      }
    },
    No = class {
      categoryId;
      config;
      displayGroups;
      currentGroupBuilder;
      constructor(e, t) {
        (this.categoryId = e),
          (this.config = t),
          (this.displayGroups = []),
          (this.currentGroupBuilder = null);
      }
      addGroup(e) {
        return (
          this.currentGroupBuilder &&
            this.finalizeGroup(this.currentGroupBuilder.getGroupData()),
          (this.currentGroupBuilder = new ko(this, e)),
          this.currentGroupBuilder
        );
      }
      finalizeGroup(e) {
        this.displayGroups.push(e);
      }
      clearCurrentGroupBuilder() {
        this.currentGroupBuilder = null;
      }
      getDefinition() {
        this.currentGroupBuilder &&
          (this.finalizeGroup(this.currentGroupBuilder.getGroupData()),
          (this.currentGroupBuilder = null));
        let e = this.displayGroups.flatMap((t) => t.properties);
        return {
          id: this.categoryId,
          properties: e,
          propertyType: this.config.propertyType || "tween",
          displayGroups: this.displayGroups,
        };
      }
    },
    or = class {
      categoryId;
      config;
      targets;
      constructor(e, t) {
        (this.categoryId = e), (this.config = t), (this.targets = []);
      }
      addTargetSchema(e, t) {
        return this.targets.push({ id: e, schema: t }), this;
      }
      getDefinition() {
        return {
          id: this.categoryId,
          label: this.config.label,
          order: this.config.order,
          targets: this.targets,
        };
      }
    },
    sr = class {
      categoryId;
      config;
      triggers;
      constructor(e, t) {
        (this.categoryId = e), (this.config = t), (this.triggers = []);
      }
      addTriggerSchema(e, t) {
        return this.triggers.push({ id: e, schema: t }), this;
      }
      getDefinition() {
        return {
          id: this.categoryId,
          label: this.config.label,
          order: this.config.order,
          triggers: this.triggers,
        };
      }
    },
    ar = class {
      categoryId;
      config;
      conditions;
      constructor(e, t) {
        (this.categoryId = e), (this.config = t), (this.conditions = []);
      }
      addConditionSchema(e, t) {
        return this.conditions.push({ id: e, schema: t }), this;
      }
      getDefinition() {
        return {
          id: this.categoryId,
          label: this.config.label,
          order: this.config.order,
          conditions: this.conditions,
        };
      }
    },
    Fo = class {
      baseInfo;
      categories = new Map();
      targetCategories = new Map();
      triggerCategories = new Map();
      conditionCategories = new Map();
      actionPresets = new Map();
      reducerHooks = [];
      constructor(e) {
        this.baseInfo = e;
      }
      addCategory(e, t = {}) {
        let r = new No(e, t);
        return this.categories.set(e, r), r;
      }
      addTargetCategory(e, t) {
        let r = new or(e, t);
        return this.targetCategories.set(e, r), r;
      }
      addTriggerCategory(e, t) {
        let r = new sr(e, t);
        return this.triggerCategories.set(e, r), r;
      }
      addConditionCategory(e, t) {
        let r = new ar(e, t);
        return this.conditionCategories.set(e, r), r;
      }
      addActionPreset(e, t) {
        let r = `${this.baseInfo.namespace}:${e}`;
        return (
          this.actionPresets.set(r, {
            id: r,
            name: t.name,
            description: t.description,
            icon: t.icon,
            timelineIcon: t.timelineIcon,
            type: "plugin",
            categoryId: t.categoryId,
            action: t.action,
            customEditor: t.customEditor,
            targetFilter: t.targetFilter,
            designerTargetFilter: t.designerTargetFilter,
            customTargetComponent: t.customTargetComponent,
          }),
          this
        );
      }
      addReducerHooks(e) {
        return this.reducerHooks.push(e), this;
      }
      buildDesign() {
        let e = [];
        for (let [, s] of this.categories) e.push(s.getDefinition());
        let t = [];
        for (let [, s] of this.targetCategories) t.push(s.getDefinition());
        let r = [];
        for (let [, s] of this.triggerCategories) r.push(s.getDefinition());
        let o = [];
        for (let [, s] of this.conditionCategories) o.push(s.getDefinition());
        let i = [];
        for (let [, s] of this.actionPresets) i.push(s);
        return {
          namespace: this.baseInfo.namespace,
          pluginId: this.baseInfo.pluginId,
          version: this.baseInfo.version,
          displayName: this.baseInfo.displayName,
          description: this.baseInfo.description,
          categories: e.length > 0 ? e : void 0,
          targetCategories: t.length > 0 ? t : void 0,
          triggerCategories: r.length > 0 ? r : void 0,
          conditionCategories: o.length > 0 ? o : void 0,
          actionPresets: i.length > 0 ? i : void 0,
          reducerHooks:
            this.reducerHooks.length > 0 ? [...this.reducerHooks] : void 0,
        };
      }
    };
});
var lr = m((ft) => {
  "use strict";
  Object.defineProperty(ft, "__esModule", { value: !0 });
  Object.defineProperty(ft, "TransformBuilder", {
    enumerable: !0,
    get: function () {
      return Lo;
    },
  });
  var Lo = class {
    baseInfo;
    triggerTransforms = new Map();
    targetTransforms = new Map();
    conditionTransforms = new Map();
    actionTransforms = new Map();
    constructor(e) {
      this.baseInfo = e;
    }
    addTargetTransform(e, t) {
      return (
        this.targetTransforms.set(
          this.createExtensionKey(e),
          function (o, i, s) {
            return t(o, i, s);
          }
        ),
        this
      );
    }
    addTriggerTransform(e, t) {
      return (
        this.triggerTransforms.set(
          this.createExtensionKey(e),
          function (o, i, s) {
            return t(o, i, s);
          }
        ),
        this
      );
    }
    addConditionTransform(e, t) {
      return (
        this.conditionTransforms.set(
          this.createExtensionKey(e),
          function (o, i, s) {
            return t(o, i, s);
          }
        ),
        this
      );
    }
    addActionTransform(e, t) {
      return (
        this.actionTransforms.set(
          this.createExtensionKey(e),
          function (o, i, s) {
            return t(o, i, s);
          }
        ),
        this
      );
    }
    createExtensionKey(e) {
      return `${this.baseInfo.namespace}:${e}`;
    }
    buildTransform() {
      return {
        namespace: this.baseInfo.namespace,
        pluginId: this.baseInfo.pluginId,
        version: this.baseInfo.version,
        displayName: this.baseInfo.displayName,
        description: this.baseInfo.description,
        triggerTransforms: this.triggerTransforms,
        targetTransforms: this.targetTransforms,
        conditionTransforms: this.conditionTransforms,
        actionTransforms: this.actionTransforms,
      };
    }
  };
});
var dr = m((ur) => {
  "use strict";
  Object.defineProperty(ur, "__esModule", { value: !0 });
});
var X = m((ie) => {
  "use strict";
  Object.defineProperty(ie, "__esModule", { value: !0 });
  function Do(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Do(ie, {
    CORE_OPERATORS: function () {
      return H.CORE_OPERATORS;
    },
    DEFAULTS: function () {
      return H.DEFAULTS;
    },
    DEFAULT_CUSTOM_EASE: function () {
      return H.DEFAULT_CUSTOM_EASE;
    },
    EASE_DEFAULTS: function () {
      return H.EASE_DEFAULTS;
    },
    RELATIONSHIP_TYPES: function () {
      return H.RELATIONSHIP_TYPES;
    },
    STANDARD_TRIGGER_ALLOWED_CONTROLS: function () {
      return H.STANDARD_TRIGGER_ALLOWED_CONTROLS;
    },
    TimelineControlType: function () {
      return H.TimelineControlType;
    },
    TweenType: function () {
      return H.TweenType;
    },
    isValidControlType: function () {
      return H.isValidControlType;
    },
    tweenTypeFromName: function () {
      return H.tweenTypeFromName;
    },
    tweenTypeToName: function () {
      return H.tweenTypeToName;
    },
  });
  var H = rr();
  ke(ir(), ie);
  ke(cr(), ie);
  ke(lr(), ie);
  ke(dr(), ie);
  function ke(n, e) {
    return (
      Object.keys(n).forEach(function (t) {
        t !== "default" &&
          !Object.prototype.hasOwnProperty.call(e, t) &&
          Object.defineProperty(e, t, {
            enumerable: !0,
            get: function () {
              return n[t];
            },
          });
      }),
      n
    );
  }
});
var pe = m((pt) => {
  "use strict";
  Object.defineProperty(pt, "__esModule", { value: !0 });
  function Bo(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Bo(pt, {
    EASING_NAMES: function () {
      return zo;
    },
    buildCustomEaseId: function () {
      return Go;
    },
    buildEaseContextId: function () {
      return Ho;
    },
    debounce: function () {
      return qo;
    },
    defaultSplitClass: function () {
      return Uo;
    },
    isValidControlType: function () {
      return jo;
    },
    throttle: function () {
      return $o;
    },
    toSeconds: function () {
      return Vo;
    },
  });
  var Ne = X();
  function jo(n) {
    return (
      n === Ne.TimelineControlType.STANDARD ||
      n === Ne.TimelineControlType.SCROLL ||
      n === Ne.TimelineControlType.LOAD ||
      n === Ne.TimelineControlType.CONTINUOUS
    );
  }
  function Vo(n) {
    return typeof n == "string" ? parseFloat(n) / 1e3 : n;
  }
  function Uo(n) {
    return `gsap_split_${n}++`;
  }
  var qo = (
      n,
      e = 0,
      { leading: t = !1, trailing: r = !0, maxWait: o } = {}
    ) => {
      let i,
        s = 0,
        a,
        c,
        l = () => {
          (s = 0), (i = void 0), r && n.apply(a, c);
        };
      function u(...d) {
        (a = this), (c = d), s || ((s = performance.now()), t && n.apply(a, c));
        let f = performance.now() - s;
        if (o && f >= o) {
          clearTimeout(i), l();
          return;
        }
        clearTimeout(i), (i = setTimeout(l, e));
      }
      return (
        (u.cancel = () => {
          clearTimeout(i), (i = void 0), (s = 0);
        }),
        u
      );
    },
    $o = (n, e = 0, { leading: t = !0, trailing: r = !0, maxWait: o } = {}) => {
      let i = 0,
        s,
        a,
        c,
        l = (d) => {
          (i = d), (s = void 0), n.apply(a, c);
        };
      function u(...d) {
        let f = performance.now();
        !i && !t && (i = f);
        let p = e - (f - i);
        (a = this),
          (c = d),
          p <= 0 || (o && f - i >= o)
            ? (s && (clearTimeout(s), (s = void 0)), l(f))
            : r && !s && (s = setTimeout(() => l(performance.now()), p));
      }
      return (
        (u.cancel = () => {
          clearTimeout(s), (s = void 0), (i = 0);
        }),
        u
      );
    };
  function Ho(n, e) {
    return `${n}-${e}`;
  }
  function Go(n, e) {
    return e ? `${n}-${e}` : n;
  }
  var zo = [
    "none",
    "power1.in",
    "power1.out",
    "power1.inOut",
    "power2.in",
    "power2.out",
    "power2.inOut",
    "power3.in",
    "power3.out",
    "power3.inOut",
    "power4.in",
    "power4.out",
    "power4.inOut",
    "back.in",
    "back.out",
    "back.inOut",
    "bounce.in",
    "bounce.out",
    "bounce.inOut",
    "circ.in",
    "circ.out",
    "circ.inOut",
    "elastic.in",
    "elastic.out",
    "elastic.inOut",
    "expo.in",
    "expo.out",
    "expo.inOut",
    "sine.in",
    "sine.out",
    "sine.inOut",
  ];
});
var fr = m((gt) => {
  "use strict";
  Object.defineProperty(gt, "__esModule", { value: !0 });
  Object.defineProperty(gt, "EventManager", {
    enumerable: !0,
    get: function () {
      return Wo;
    },
  });
  var we = pe(),
    Z,
    Wo =
      ((Z = class {
        elementHandlers = new WeakMap();
        eventTypeHandlers = new Map();
        customEventTypes = new Map();
        delegatedHandlers = new Map();
        batchedEvents = new Map();
        batchFrameId = null;
        defaultMaxBatchSize = 10;
        defaultMaxBatchAge = 100;
        defaultErrorHandler = (e, t) =>
          console.error("[EventManager] Error handling event:", e, t);
        constructor() {}
        static getInstance() {
          return Z.instance || (Z.instance = new Z()), Z.instance;
        }
        addEventListener(e, t, r, o) {
          try {
            let i = o?.kind === "custom",
              s = {
                ...(i ? { delegate: !1, passive: !0, batch: !1 } : Xo[t] || {}),
                ...o,
                errorHandler: o?.errorHandler || this.defaultErrorHandler,
              };
            if (!i && t === "load" && "complete" in e && e.complete)
              return (
                setTimeout(() => {
                  try {
                    r(new Event("load"), e);
                  } catch (u) {
                    s.errorHandler?.(u, new Event("load"));
                  }
                }, 0),
                () => {}
              );
            if (!e || !e.addEventListener)
              throw new Error("Invalid element provided to addEventListener");
            let a = this.createWrappedHandler(r, s, e),
              c = this.registerHandler(e, t, r, a.handler, s, i, a.cleanup);
            if (i)
              return () => {
                this.removeHandler(e, t, r, !0), c.cleanup?.();
              };
            let l = new AbortController();
            return (
              this.ensureDelegatedHandler(t),
              s.delegate ||
                (Yo(s) || e).addEventListener(t, c.wrappedHandler, {
                  passive: s.passive,
                  signal: l.signal,
                }),
              () => {
                l.abort(), this.removeHandler(e, t, r, !1);
              }
            );
          } catch (i) {
            return o?.errorHandler?.(i, new Event(t)), () => {};
          }
        }
        emit(e, t, r, o) {
          try {
            let i = this.customEventTypes.get(e);
            if (!i?.size) return;
            let s = new CustomEvent(e, {
              detail: t,
              bubbles: o?.bubbles ?? !0,
              cancelable: !0,
            });
            for (let a of i)
              if (!r || r === a.element || a.element.contains(r))
                try {
                  a.wrappedHandler(s);
                } catch (c) {
                  console.error(`[EventManager] Error emitting ${e}:`, c);
                }
          } catch (i) {
            console.error(
              `[EventManager] Error emitting custom event ${e}:`,
              i
            );
          }
        }
        dispose() {
          this.batchFrameId !== null &&
            (cancelAnimationFrame(this.batchFrameId),
            (this.batchFrameId = null),
            this.batchedEvents.clear());
          for (let [, e] of this.delegatedHandlers) e.controller.abort();
          for (let [, e] of this.eventTypeHandlers)
            for (let t of e) t.cleanup?.();
          for (let [, e] of this.customEventTypes)
            for (let t of e) t.cleanup?.();
          this.delegatedHandlers.clear(),
            (this.elementHandlers = new WeakMap()),
            this.eventTypeHandlers.clear(),
            this.customEventTypes.clear();
        }
        createWrappedHandler(e, t, r) {
          let o = (i) => {
            try {
              let s =
                t.target === "window"
                  ? window
                  : t.target === "document"
                  ? document
                  : r;
              e(i, s);
            } catch (s) {
              (t.errorHandler || this.defaultErrorHandler)(s, i);
            }
          };
          if (t.batch) {
            let i = (s) => {
              let a = s.type || "unknown";
              this.batchedEvents.has(a) || this.batchedEvents.set(a, []),
                this.batchedEvents
                  .get(a)
                  .push({
                    event: s,
                    target: r,
                    timestamp: s.timeStamp || performance.now(),
                  }),
                this.batchFrameId == null &&
                  (this.batchFrameId = requestAnimationFrame(() =>
                    this.processBatchedEvents()
                  ));
            };
            if (t.throttleMs && t.throttleMs > 0) {
              let s = (0, we.throttle)(o, t.throttleMs);
              return { handler: i, cleanup: s.cancel };
            }
            if (t.debounceMs && t.debounceMs > 0) {
              let s = (0, we.debounce)(o, t.debounceMs);
              return { handler: i, cleanup: s.cancel };
            }
            return { handler: i };
          }
          if (t.throttleMs && t.throttleMs > 0) {
            let i = (0, we.throttle)(o, t.throttleMs);
            if (t.debounceMs && t.debounceMs > 0) {
              let s = (0, we.debounce)(i, t.debounceMs);
              return {
                handler: s,
                cleanup: () => {
                  s.cancel?.(), i.cancel?.();
                },
              };
            }
            return { handler: i, cleanup: i.cancel };
          }
          if (t.debounceMs && t.debounceMs > 0) {
            let i = (0, we.debounce)(o, t.debounceMs);
            return { handler: i, cleanup: i.cancel };
          }
          return { handler: o };
        }
        processBatchedEvents() {
          if (this.batchFrameId === null) return;
          this.batchFrameId = null;
          let e = performance.now();
          for (let [t, r] of this.batchedEvents) {
            let o = this.eventTypeHandlers.get(t);
            if (!o?.size) continue;
            let i = r.filter((a) => e - a.timestamp < this.defaultMaxBatchAge);
            if (!i.length) continue;
            i.sort((a, c) => a.timestamp - c.timestamp);
            let s =
              i.length <= this.defaultMaxBatchSize
                ? i
                : i.slice(-this.defaultMaxBatchSize);
            for (let { event: a, target: c } of s) {
              let l = a;
              (l.batchTimestamp = e), (l.batchSize = s.length);
              for (let u of o)
                try {
                  (u.config.delegate ||
                    u.config.target === "window" ||
                    u.config.target === "document" ||
                    c === a.target ||
                    c.contains(a.target)) &&
                    u.wrappedHandler(l);
                } catch (d) {
                  (u.config.errorHandler || this.defaultErrorHandler)(d, l);
                }
            }
          }
          this.batchedEvents.clear();
        }
        ensureDelegatedHandler(e) {
          if (this.delegatedHandlers.has(e)) return;
          let t = new AbortController(),
            r = (i) => {
              let s = this.eventTypeHandlers.get(e);
              if (!s?.size) return;
              let a = i.composedPath
                ? i.composedPath()
                : i.target
                ? [i.target]
                : [];
              for (let c of a)
                if (c instanceof Element) {
                  for (let l of s) {
                    if (!l.config.delegate) continue;
                    if (l.element === c || l.element.contains(c))
                      try {
                        l.wrappedHandler(i);
                      } catch (d) {
                        console.error(`[EventDelegator] Error for ${e}:`, d);
                      }
                  }
                  if (!i.bubbles) break;
                }
            },
            o = [
              "focus",
              "blur",
              "focusin",
              "focusout",
              "mouseenter",
              "mouseleave",
            ].includes(e);
          document.addEventListener(e, r, {
            passive: !1,
            capture: o,
            signal: t.signal,
          }),
            this.delegatedHandlers.set(e, { handler: r, controller: t });
        }
        registerHandler(e, t, r, o, i, s, a) {
          let c = {
            element: e,
            originalHandler: r,
            wrappedHandler: o,
            config: i,
            cleanup: a,
          };
          if (s) {
            let l = this.customEventTypes.get(t) || new Set();
            l.add(c), this.customEventTypes.set(t, l);
          } else {
            let l = this.elementHandlers.get(e) || new Set();
            l.add(c), this.elementHandlers.set(e, l);
            let u = this.eventTypeHandlers.get(t) || new Set();
            u.add(c), this.eventTypeHandlers.set(t, u);
          }
          return c;
        }
        removeHandler(e, t, r, o) {
          if (o) {
            let i = this.customEventTypes.get(t);
            if (!i?.size) return;
            for (let s of i)
              if (s.element === e && s.originalHandler === r) {
                i.delete(s),
                  i.size || this.customEventTypes.delete(t),
                  s.cleanup?.();
                break;
              }
          } else {
            let i = this.eventTypeHandlers.get(t);
            if (!i?.size) return;
            let s = this.elementHandlers.get(e);
            if (!s?.size) return;
            let a;
            for (let c of s)
              if (c.originalHandler === r) {
                a = c;
                break;
              }
            if (a) {
              if ((s.delete(a), i.delete(a), !i.size)) {
                this.eventTypeHandlers.delete(t);
                let c = this.delegatedHandlers.get(t);
                c && (c.controller.abort(), this.delegatedHandlers.delete(t));
              }
              a.cleanup?.();
            }
          }
        }
      }),
      fe(Z, "instance"),
      Z);
  function Yo(n) {
    return n.target === "window"
      ? window
      : n.target === "document"
      ? document
      : null;
  }
  var Xo = {
    load: { delegate: !1, passive: !0 },
    DOMContentLoaded: { target: "document", passive: !0 },
    readystatechange: { target: "document", passive: !0 },
    beforeunload: { target: "window", passive: !1 },
    unload: { target: "window", passive: !1 },
    pageshow: { target: "window", passive: !0 },
    pagehide: { target: "window", passive: !0 },
    click: { delegate: !0, passive: !1 },
    dblclick: { delegate: !0, passive: !0 },
    mousedown: { delegate: !0, passive: !0 },
    mouseup: { delegate: !0, passive: !0 },
    mousemove: { delegate: !0, batch: !0, passive: !0 },
    mouseenter: { delegate: !1, passive: !0 },
    mouseleave: { delegate: !1, passive: !0 },
    mouseout: { delegate: !0, passive: !0 },
    contextmenu: { delegate: !0, passive: !1 },
    wheel: { delegate: !0, throttleMs: 16, passive: !0, batch: !0 },
    touchstart: { delegate: !0, passive: !0 },
    touchend: { delegate: !0, passive: !1 },
    touchmove: { delegate: !0, batch: !0, passive: !0 },
    touchcancel: { delegate: !0, passive: !0 },
    pointerdown: { delegate: !0, passive: !0 },
    pointerup: { delegate: !0, passive: !0 },
    pointermove: { delegate: !0, batch: !0, passive: !0 },
    pointerenter: { delegate: !1, passive: !0 },
    pointerleave: { delegate: !1, passive: !0 },
    pointercancel: { delegate: !0, passive: !0 },
    keydown: { delegate: !0, passive: !1 },
    keyup: { delegate: !0, passive: !1 },
    keypress: { delegate: !0, passive: !1 },
    input: { delegate: !0, passive: !1 },
    change: { delegate: !0, passive: !1 },
    focus: { delegate: !1, passive: !0 },
    blur: { delegate: !1, passive: !0 },
    focusin: { delegate: !0, passive: !0 },
    focusout: { delegate: !0, passive: !0 },
    submit: { delegate: !0, passive: !1 },
    reset: { delegate: !0, passive: !1 },
    select: { delegate: !0, passive: !0 },
    selectionchange: { target: "document", passive: !0 },
    dragstart: { delegate: !0, passive: !1 },
    drag: { delegate: !0, passive: !0 },
    dragenter: { delegate: !0, passive: !1 },
    dragleave: { delegate: !0, passive: !0 },
    dragover: { delegate: !0, passive: !1 },
    drop: { delegate: !0, passive: !1 },
    dragend: { delegate: !0, passive: !0 },
    play: { delegate: !0, passive: !0 },
    pause: { delegate: !0, passive: !0 },
    ended: { delegate: !0, passive: !0 },
    timeupdate: { delegate: !0, batch: !0, passive: !0 },
    canplay: { delegate: !0, passive: !0 },
    canplaythrough: { delegate: !0, passive: !0 },
    loadeddata: { delegate: !0, passive: !0 },
    animationstart: { delegate: !0, passive: !0 },
    animationend: { delegate: !0, passive: !0 },
    animationiteration: { delegate: !0, passive: !0 },
    transitionstart: { delegate: !0, passive: !0 },
    transitionend: { delegate: !0, passive: !0 },
    transitionrun: { delegate: !0, passive: !0 },
    transitioncancel: { delegate: !0, passive: !0 },
    scroll: { delegate: !1, throttleMs: 16, passive: !0 },
    resize: { target: "window", throttleMs: 16, passive: !0 },
    intersection: { delegate: !1, passive: !0 },
    orientationchange: { target: "window", passive: !0 },
    visibilitychange: { target: "document", passive: !0 },
    storage: { target: "window", passive: !0 },
    online: { target: "window", passive: !0 },
    offline: { target: "window", passive: !0 },
    hashchange: { target: "window", passive: !0 },
    popstate: { target: "window", passive: !0 },
    copy: { delegate: !0, passive: !1 },
    cut: { delegate: !0, passive: !1 },
    paste: { delegate: !0, passive: !1 },
    compositionstart: { delegate: !0, passive: !1 },
    compositionupdate: { delegate: !0, passive: !1 },
    compositionend: { delegate: !0, passive: !1 },
    beforeinput: { delegate: !0, passive: !1 },
  };
});
var mt = m((ht) => {
  "use strict";
  Object.defineProperty(ht, "__esModule", { value: !0 });
  function Zo(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Zo(ht, {
    convertEaseConfigToGSAP: function () {
      return gr;
    },
    convertEaseConfigToLinear: function () {
      return Ko;
    },
    isAdvancedEase: function () {
      return Jo;
    },
    isBasicEase: function () {
      return es;
    },
  });
  var Ce = pe();
  function pr() {
    return {
      gsap: window.gsap,
      CustomEase: window.CustomEase,
      CustomWiggle: window.CustomWiggle,
      CustomBounce: window.CustomBounce,
    };
  }
  function gr(n, e = pr(), t) {
    return n == null
      ? "none"
      : typeof n == "number"
      ? Ce.EASING_NAMES[n] || "none"
      : Qo(n, e, t);
  }
  function Qo(n, e, t) {
    switch (n.type) {
      case "back":
        return `back.${n.curve}(${n.power})`;
      case "elastic":
        return `elastic.${n.curve}(${n.amplitude}, ${n.period})`;
      case "steps":
        return `steps(${n.stepCount})`;
      case "rough": {
        let {
          templateCurve: r,
          points: o,
          strength: i,
          taper: s,
          randomizePoints: a,
          clampPoints: c,
        } = n;
        return `rough({ template: ${r}, strength: ${i}, points: ${o}, taper: ${s}, randomize: ${a}, clamp: ${c} })`;
      }
      case "slowMo":
        return `slow(${n.linearRatio}, ${n.power}, ${n.yoyoMode})`;
      case "expoScale":
        return `expoScale(${n.startingScale}, ${n.endingScale}, ${n.templateCurve})`;
      case "customWiggle": {
        let { CustomWiggle: r } = e;
        return r
          ? r.create((0, Ce.buildCustomEaseId)("customIX3Wiggle", t), {
              wiggles: n.wiggles,
              type: n.wiggleType,
            })
          : null;
      }
      case "customBounce": {
        let { CustomBounce: r } = e;
        return r
          ? r.create((0, Ce.buildCustomEaseId)("customIX3Bounce", t), {
              strength: n.strength,
              endAtStart: n.endAtStart,
              squash: n.squash,
              squashID: (0, Ce.buildCustomEaseId)("customIX3Squash", t),
            })
          : null;
      }
      case "customEase": {
        let { CustomEase: r } = e;
        return r
          ? r.create(
              (0, Ce.buildCustomEaseId)("customIX3Ease", t),
              n.bezierCurve
            )
          : null;
      }
      default:
        return "none";
    }
  }
  function Ko(n, e = pr(), t = 20) {
    if (n == null) return "linear";
    let r = gr(n, e);
    if (r === null) return "linear";
    if (typeof n == "object" && n.type === "steps")
      return `steps(${n.stepCount})`;
    let { gsap: o } = e;
    if (!o) return "linear";
    let i = o.parseEase(r);
    if (typeof i != "function") return "linear";
    let s = [];
    for (let a = 0; a <= t; a++) {
      let c = a / t,
        l = i(c);
      s.push({ t: Number(c.toFixed(4)), value: Number(l.toFixed(4)) });
    }
    return (
      "linear(" +
      s.map((a) => `${a.value} ${Math.round(a.t * 100)}%`).join(", ") +
      ")"
    );
  }
  function Jo(n) {
    return typeof n == "object" && n !== null;
  }
  function es(n) {
    return typeof n == "number";
  }
});
var hr = m((yt) => {
  "use strict";
  Object.defineProperty(yt, "__esModule", { value: !0 });
  Object.defineProperty(yt, "PluginRuntimeBridge", {
    enumerable: !0,
    get: function () {
      return ts;
    },
  });
  var ts = class {
    intervalHandlers = new Map();
    channelSubscribers = new Map();
    registerIntervalHandler(e, t) {
      let r = this.intervalHandlers.get(e);
      r !== t &&
        (r !== void 0 &&
          console.warn(
            "IX3: registerIntervalHandler called twice. The previous handler is being replaced; verify the plugin is registered exactly once (or use a unique pluginKey per concurrent handler).",
            { pluginKey: e }
          ),
        this.intervalHandlers.set(e, t));
    }
    fireInterval(e) {
      for (let [t, r] of this.intervalHandlers)
        try {
          r(e);
        } catch (o) {
          console.error(
            "IX3: interval handler threw. Continuing with the remaining handlers. Investigate the plugin to prevent silent data drift.",
            { pluginKey: t },
            o
          );
        }
    }
    publish(e, t, r) {
      let o = this.channelSubscribers.get(e);
      if (o) {
        for (let i of o.values())
          for (let s of i.slice())
            if (!(s.element && r && s.element !== r))
              try {
                s.cb(t);
              } catch (a) {
                console.error(
                  "IX3: channel subscriber threw. Continuing with remaining subscribers.",
                  { channel: e },
                  a
                );
              }
      }
    }
    subscribe(e, t, r, o) {
      let i = this.channelSubscribers.get(t);
      i || ((i = new Map()), this.channelSubscribers.set(t, i));
      let s = i.get(e) ?? [],
        a = { element: r, cb: o };
      return (
        s.push(a),
        i.set(e, s),
        () => {
          let c = this.channelSubscribers.get(t)?.get(e);
          if (!c) return;
          let l = c.indexOf(a);
          l !== -1 && c.splice(l, 1),
            c.length === 0 &&
              (this.channelSubscribers.get(t)?.delete(e),
              this.channelSubscribers.get(t)?.size === 0 &&
                this.channelSubscribers.delete(t));
        }
      );
    }
    destroyTimeline(e) {
      for (let [t, r] of this.channelSubscribers)
        r.delete(e), r.size === 0 && this.channelSubscribers.delete(t);
    }
  };
});
var mr = m((vt) => {
  "use strict";
  Object.defineProperty(vt, "__esModule", { value: !0 });
  Object.defineProperty(vt, "RuntimeMotionDriver", {
    enumerable: !0,
    get: function () {
      return ns;
    },
  });
  var ns = class {
    env;
    constructor(e) {
      this.env = e;
    }
    hasGsap() {
      return this.env.win.gsap != null;
    }
    hasObserver() {
      return this.env.win.Observer != null;
    }
    timeline() {
      return this.env.win.gsap?.timeline() ?? null;
    }
    to(...e) {
      return this.env.win.gsap?.to(...e) ?? null;
    }
    set(...e) {
      this.env.win.gsap?.set(...e);
    }
    getProperty(...e) {
      return this.env.win.gsap?.getProperty(...e) ?? 0;
    }
    quickSetter(...e) {
      return this.env.win.gsap?.quickSetter(...e) ?? null;
    }
    quickTo(...e) {
      return this.env.win.gsap?.quickTo(...e) ?? null;
    }
    addTicker(e) {
      let t = this.env.win.gsap;
      if (t?.ticker)
        return (
          t.ticker.add(e),
          () => {
            try {
              t.ticker?.remove(e);
            } catch {}
          }
        );
      let r = this.env.win,
        o = 0,
        i = !0,
        s = () => {
          i && (e(), i && (o = r.requestAnimationFrame(s)));
        };
      return (
        (o = r.requestAnimationFrame(s)),
        () => {
          (i = !1), r.cancelAnimationFrame(o);
        }
      );
    }
    createObserver(...e) {
      return this.env.win.Observer?.create(...e) ?? null;
    }
  };
});
var vr = m((wt) => {
  "use strict";
  Object.defineProperty(wt, "__esModule", { value: !0 });
  Object.defineProperty(wt, "AnimationCoordinator", {
    enumerable: !0,
    get: function () {
      return os;
    },
  });
  var bt = X(),
    L = pe(),
    Tt = mt(),
    rs = hr(),
    is = mr(),
    oe,
    os =
      ((oe = class {
        timelineDefs;
        getHandler;
        getTargetResolver;
        resolveFn;
        getInteractionForTimeline;
        env;
        subs;
        dynamicFlags;
        cleanupFns;
        scrollTriggers;
        aliases;
        pluginRuntimeBridge;
        animation;
        resolveAlias(e, t = 0) {
          if (t > oe.MAX_ALIAS_DEPTH)
            return (
              console.warn(
                `IX3: Timeline alias chain exceeded max depth for "${e}". Possible circular reference.`
              ),
              e
            );
          let r = this.aliases.get(e);
          return r ? this.resolveAlias(r, t + 1) : e;
        }
        shouldFlipEaseForTimeline(e) {
          let t = this.resolveSourceTimelineId(e);
          if (this.timelineUsesReverseFlipEase(t)) return !0;
          for (let [r] of this.timelineDefs)
            if (
              r !== t &&
              this.resolveSourceTimelineId(r) === t &&
              this.timelineUsesReverseFlipEase(r)
            )
              return !0;
          return !1;
        }
        timelineUsesReverseFlipEase(e) {
          if (this.timelineDefs.get(e)?.settings?.control === "reverseFlipEase")
            return !0;
          let r = this.getInteractionForTimeline(e);
          if (r) {
            for (let [, o] of r.triggers)
              if (o?.control === "reverseFlipEase") return !0;
          }
          return !1;
        }
        resolveSourceTimelineId(e) {
          let t = e;
          for (let r = 0; r <= oe.MAX_ALIAS_DEPTH; r++) {
            let i = this.timelineDefs.get(t)?.reuse?.sourceTimelineId;
            if (!i) return t;
            t = i;
          }
          return (
            console.warn(
              `IX3: Timeline reuse chain exceeded max depth for "${e}". Possible circular reference.`
            ),
            t
          );
        }
        globalSplitRegistry;
        timelineTargetsCache;
        constructor(e, t, r, o, i, s) {
          (this.timelineDefs = e),
            (this.getHandler = t),
            (this.getTargetResolver = r),
            (this.resolveFn = o),
            (this.getInteractionForTimeline = i),
            (this.env = s),
            (this.subs = new Map()),
            (this.dynamicFlags = new Map()),
            (this.cleanupFns = new Map()),
            (this.scrollTriggers = new Map()),
            (this.aliases = new Map()),
            (this.pluginRuntimeBridge = new rs.PluginRuntimeBridge()),
            (this.globalSplitRegistry = new Map()),
            (this.timelineTargetsCache = new WeakMap()),
            (this.getStaggerConfig = (a, c) => {
              if (!a) return;
              let {
                  ease: l,
                  amount: u,
                  from: d,
                  grid: f,
                  axis: p,
                  each: h,
                } = a,
                g = {};
              if (
                (u != null && (g.amount = (0, L.toSeconds)(u)),
                h != null && (g.each = (0, L.toSeconds)(h)),
                d != null && (g.from = d),
                f != null && (g.grid = f),
                p != null && (g.axis = p),
                l != null)
              ) {
                let y = (0, Tt.convertEaseConfigToGSAP)(l, void 0, c);
                y != null && (g.ease = y);
              }
              return g;
            }),
            (this.animation = new is.RuntimeMotionDriver(s));
        }
        createTimeline(e, t) {
          this.destroy(e);
          let r = this.timelineDefs.get(e);
          if (!r) return;
          if (r.reuse?.sourceTimelineId) {
            this.aliases.set(e, r.reuse.sourceTimelineId);
            return;
          }
          let o = this.isDynamicTimeline(r, t);
          this.dynamicFlags.set(e, o);
          let i = new Set(),
            s = new Set();
          for (let [, a, c] of t.triggers) {
            if (c) for (let u of this.resolveFn(c, {}, t)) s.add(u);
            let l = a?.controlType;
            l && (0, L.isValidControlType)(l) && i.add(l);
          }
          if (!s.size || !o) {
            let a = this.buildSubTimeline(e, null, i);
            a && this.ensureSubs(e).set(null, a);
          }
          if (s.size) {
            let a = this.ensureSubs(e);
            for (let c of s)
              if (!a.has(c)) {
                let l = o
                  ? this.buildSubTimeline(e, c, i)
                  : this.getSub(e, null);
                o && l && a.set(c, l);
              }
          }
        }
        getTimeline(e, t) {
          return this.getSub(e, t)?.timeline;
        }
        getAllTimelines(e) {
          let t = this.resolveAlias(e),
            r = this.subs.get(t);
          return r ? Array.from(r.values()).map((o) => o.timeline) : [];
        }
        play(e, t, r) {
          this.getSub(e, t)?.timeline.play(r ?? void 0);
        }
        pause(e, t, r) {
          let o = this.getSubOrNull(e, t);
          o && (r !== void 0 ? o.timeline.pause(r) : o.timeline.pause());
        }
        resume(e, t, r) {
          this.getSubOrNull(e, t)?.timeline.resume(r);
        }
        reverse(e, t, r) {
          this.getSub(e, t)?.timeline.reverse(r);
        }
        restart(e, t) {
          this.getSub(e, t)?.timeline.restart();
        }
        getTriggerMetadata(e) {
          return this.timelineDefs.get(e)?.triggerMetadata ?? null;
        }
        fireInterval(e, t, r = {}) {
          this.pluginRuntimeBridge.fireInterval({
            coordinator: this,
            timelineId: e,
            element: t,
            options: r,
            animation: this.animation,
          });
        }
        registerIntervalHandler(e, t) {
          this.pluginRuntimeBridge.registerIntervalHandler(e, t);
        }
        getOneShotTimelineContext(e) {
          let t = this.getTimelineDef(e);
          return t
            ? {
                timelineId: e,
                timelineDef: t,
                getFirstActionTargets: (r) => this.getFirstActionTargets(e, r),
                getActionTweenConfig: (r, o, i) =>
                  this.getActionTweenConfig(r, o, i),
                buildActionTimeline: (r) =>
                  this.buildOneShotActionTimeline(e, r),
                registerCleanup: (r) => this.registerCleanup(e, r),
              }
            : null;
        }
        getTimelineDef(e) {
          return this.timelineDefs.get(this.resolveAlias(e));
        }
        getFirstActionTargets(e, t) {
          let o = this.getTimelineDef(e)?.actions?.[0];
          return o ? this.collectTargets(o, t, e) : [];
        }
        getActionTweenConfig(e, t, r) {
          let o = this.getHandler(t);
          if (!o?.createTweenConfig) return null;
          let i = e.properties[t] || {};
          return o.createTweenConfig(i, r);
        }
        registerCleanup(e, t) {
          let r = this.cleanupFns.get(e) ?? new Set();
          return (
            this.cleanupFns.set(e, r),
            r.add(t),
            () => {
              r.delete(t);
            }
          );
        }
        publishChannel(e, t, r) {
          this.pluginRuntimeBridge.publish(e, t, r);
        }
        subscribeChannel(e, t, r, o) {
          return this.pluginRuntimeBridge.subscribe(e, t, r, o);
        }
        buildOneShotActionTimeline(e, t) {
          let r = this.getTimelineDef(e);
          if (!r?.actions?.length) return null;
          let o = this.animation.timeline();
          if (!o) return null;
          t.beforeTweens?.(o);
          for (let i of r.actions)
            this.buildTweensForAction(
              i,
              t.targets,
              o,
              e,
              !1,
              t.varsTransform,
              void 0,
              void 0,
              void 0,
              t.cleanupBucket
            );
          return o;
        }
        togglePlayReverse(e, t) {
          let r = this.getSub(e, t)?.timeline;
          if (!r) return;
          let o = r.progress();
          o === 0
            ? r.play()
            : o === 1
            ? r.reverse()
            : r.reversed()
            ? r.play()
            : r.reverse();
        }
        seek(e, t, r) {
          this.getSubOrNull(e, r)?.timeline.seek(t);
        }
        setTimeScale(e, t, r) {
          this.getSubOrNull(e, r)?.timeline.timeScale(t);
        }
        setTotalProgress(e, t, r) {
          this.getSubOrNull(e, r)?.timeline.totalProgress(t);
        }
        setContinuousProgress(e, t, r) {
          this.getSub(e, r)?.timeline.progress(Math.max(0, Math.min(1, t)));
        }
        isPlaying(e, t) {
          return !!this.getSubOrNull(e, t)?.timeline.isActive();
        }
        isPaused(e, t) {
          return !!this.getSubOrNull(e, t)?.timeline.paused();
        }
        destroy(e) {
          this.aliases.delete(e), this.pluginRuntimeBridge.destroyTimeline(e);
          let t = this.subs.get(e);
          if (t) {
            for (let [, r] of t) {
              if (
                ((r.rebuildState = "init"),
                r.timeline && (r.timeline.revert(), r.timeline.kill()),
                r.scrollTriggerIds)
              ) {
                for (let o of r.scrollTriggerIds) this.cleanupScrollTrigger(o);
                r.scrollTriggerIds.clear();
              }
              r.scrollTriggerConfigs && r.scrollTriggerConfigs.clear();
              for (let o of r.cleanupFns ?? []) o();
              r.cleanupFns?.clear(), this.timelineTargetsCache.delete(r);
            }
            for (let [, r] of this.globalSplitRegistry)
              r.splitInstance.revert();
            this.globalSplitRegistry.clear();
          }
          for (let r of this.cleanupFns.get(e) ?? []) r();
          this.cleanupFns.delete(e),
            this.subs.delete(e),
            this.dynamicFlags.delete(e);
        }
        isDynamicTimeline(e, t) {
          let r = t.triggers.some(
            ([, i]) => i?.controlType !== bt.TimelineControlType.LOAD
          );
          if (t.scope?.type === "component" && r) return !0;
          let o = e.actions;
          if (!o?.length) return !1;
          for (let i of o) {
            for (let s of i.targets ?? []) {
              if (this.getTargetResolver(s)?.isDynamic) return !0;
              if (s.length === 3 && s[2]) {
                let c = s[2];
                if (
                  c.filterBy &&
                  c.relationship !== "none" &&
                  this.getTargetResolver(c.filterBy)?.isDynamic
                )
                  return !0;
              }
            }
            if (r)
              for (let s in i.properties) {
                let a = this.getHandler(s);
                if (a?.createCustomTween && a.requiresTriggerElementContext)
                  return !0;
              }
          }
          return !1;
        }
        ensureSubs(e) {
          return (
            this.subs.has(e) || this.subs.set(e, new Map()), this.subs.get(e)
          );
        }
        getSub(e, t) {
          let r = this.resolveAlias(e),
            o = this.ensureSubs(r),
            i = this.dynamicFlags.get(r),
            s = o.get(i ? t : null);
          return (
            s ||
              ((s = this.buildSubTimeline(r, t)), s && o.set(i ? t : null, s)),
            s
          );
        }
        getSubOrNull(e, t) {
          let r = this.resolveAlias(e),
            o = this.dynamicFlags.get(r);
          return this.subs.get(r)?.get(o ? t ?? null : null);
        }
        convertToGsapDefaults(e, t) {
          let r = {},
            o = t ? (0, L.buildEaseContextId)(t, "defaults") : void 0,
            i = t ? (0, L.buildEaseContextId)(t, "defaults-stagger") : void 0;
          if (
            (e.duration != null && (r.duration = (0, L.toSeconds)(e.duration)),
            e.ease != null)
          ) {
            let s = (0, Tt.convertEaseConfigToGSAP)(e.ease, void 0, o);
            s != null && (r.ease = s);
          }
          if (
            (e.delay != null &&
              (r.delay =
                typeof e.delay == "number"
                  ? e.delay
                  : (0, L.toSeconds)(e.delay)),
            e.repeat != null && (r.repeat = e.repeat),
            e.repeatDelay != null &&
              (r.repeatDelay = (0, L.toSeconds)(e.repeatDelay)),
            e.stagger != null)
          ) {
            let s = this.getStaggerConfig(e.stagger, i);
            s && (r.stagger = s);
          }
          return e.yoyo != null && (r.yoyo = e.yoyo), r;
        }
        buildSubTimeline(e, t, r) {
          let o = this.timelineDefs.get(e),
            i = o?.actions,
            s = o?.settings,
            a = this.env.win.gsap;
          if (!a) return;
          let c = a.timeline({
              ...this.convertToGsapDefaults(s || {}, e),
              paused: !0,
              reversed: !!o?.playInReverse,
              data: { id: e, triggerEl: t || void 0 },
            }),
            l = o
              ? { ...o, actions: i || [] }
              : { id: e, pageId: "", deleted: !1, actions: [] },
            u = {
              timeline: c,
              timelineId: e,
              elementContext: t,
              timelineDef: l,
              rebuildState: "init",
              controlTypes: r,
            };
          if (!i?.length) return u;
          if (this.env.win.SplitText) {
            let d = this.analyzeSplitRequirements(i, t, e);
            for (let [f, { types: p, masks: h }] of d) {
              let g = this.getSplitTypeString(p),
                y = this.getMaskString(h);
              this.doSplitText(
                { type: g, mask: y },
                [f],
                u,
                this.env.win.SplitText
              );
            }
          }
          return this.buildTimeline(u), u;
        }
        buildTimeline(e) {
          let t = e.timelineDef,
            r = e.elementContext,
            o = e.timeline,
            i = e.timelineId,
            s = new Map();
          for (let a = 0; a < t.actions.length; a++) {
            let c = t.actions[a];
            if (!c) continue;
            let l = JSON.stringify(c.targets),
              u = !0,
              d = yr(c),
              f = d === "none" ? l : `${l}_split_${d}`;
            for (let g of Object.values(c.properties ?? {})) {
              let y = s.get(f) || new Set();
              s.set(f, y);
              for (let E of Object.keys(g || {}))
                y.has(E) ? (u = !1) : y.add(E);
            }
            let p = this.collectTargets(c, r, i);
            if (!p.length) {
              let g = !1;
              for (let y in c.properties)
                if (this.getHandler(y)?.createCustomTween) {
                  g = !0;
                  break;
                }
              if (!g) continue;
            }
            let h = p;
            (d !== "none" &&
              p.length > 0 &&
              this.env.win.SplitText &&
              ((h = this.getSplitElements(p, d)), h.length === 0)) ||
              this.buildTweensForAction(
                c,
                h,
                o,
                i,
                u,
                void 0,
                r,
                t.triggerMetadata?.role,
                e
              );
          }
        }
        collectTargets(e, t, r) {
          if (!e.targets) return [];
          let o = [],
            i = this.getInteractionForTimeline(r);
          for (let s of e.targets ?? []) {
            let a = this.resolveFn(s, t ? { triggerElement: t } : {}, i);
            o.push(...a);
          }
          return o;
        }
        buildTweensForAction(e, t, r, o, i, s, a, c, l, u) {
          let d = this.shouldFlipEaseForTimeline(o);
          for (let f in e.properties) {
            let p = f,
              h = this.getHandler(p);
            if (!h) continue;
            let g = e.properties[p] || {};
            try {
              let y = e.timing?.position;
              y =
                typeof y == "string" && y.endsWith("ms")
                  ? (0, L.toSeconds)(y)
                  : y ?? 0;
              let E = e.timing?.duration ?? bt.DEFAULTS.DURATION,
                M = this.getStaggerConfig(
                  e.timing?.stagger,
                  (0, L.buildEaseContextId)(e.id, "stagger")
                );
              M && E === 0 && (E = 0.001);
              let S = { id: e.id, presetId: e.presetId, color: e.color },
                C = {
                  force3D: !0,
                  ...(!i && { immediateRender: i }),
                  data: S,
                  ...(e.tt !== 3 && { duration: (0, L.toSeconds)(E) }),
                  ...(e.timing?.repeat != null && { repeat: e.timing.repeat }),
                  ...(e.timing?.repeatDelay != null && {
                    repeatDelay: (0, L.toSeconds)(e.timing.repeatDelay),
                  }),
                  ...(e.timing?.yoyo != null && { yoyo: e.timing.yoyo }),
                  ...(M && { stagger: M }),
                };
              if (e.timing?.ease != null) {
                let v = (0, Tt.convertEaseConfigToGSAP)(
                  e.timing.ease,
                  void 0,
                  (0, L.buildEaseContextId)(e.id, "timing")
                );
                v != null && (C.ease = v);
              }
              if ((d && (C.easeReverse = !0), h.createTweenConfig)) {
                let v = h.createTweenConfig(g, t);
                s?.(p, e, v);
                let T = Object.keys(v.from || {}).length > 0,
                  w = Object.keys(v.to || {}).length > 0,
                  _ = e.tt ?? 0;
                if (_ === 0 && !w) continue;
                if (_ === 1 && !T) continue;
                if (_ === 2 && !T && !w) continue;
                if (_ === 3 && !w) continue;
                _ === 1
                  ? r.from(t, { ...C, ...v.from }, y)
                  : _ === 2
                  ? r.fromTo(t, { ...v.from }, { ...C, ...v.to }, y)
                  : _ === 3
                  ? r.set(t, { ...C, ...v.to }, y)
                  : r.to(t, { ...C, ...v.to }, y);
              } else if (h.createCustomTween) {
                let v = h.createCustomTween(r, e, g, C, t, y || 0, {
                  triggerElement: a ?? null,
                  timelineRole: c,
                  subscribeChannel: (T, w) =>
                    this.subscribeChannel(o, T, a ?? null, w),
                  animation: this.animation,
                });
                if (v)
                  if (u != null) u.add(v);
                  else if (l != null) {
                    let T = l.cleanupFns ?? new Set();
                    (l.cleanupFns = T), T.add(v);
                  } else {
                    let T = this.cleanupFns.get(o) ?? new Set();
                    this.cleanupFns.set(o, T), T.add(v);
                  }
              }
            } catch (y) {
              console.error("Error building tween:", y);
            }
          }
        }
        analyzeSplitRequirements(e, t, r) {
          let o = new Map();
          for (let i of e) {
            let s = yr(i);
            if (s === "none") continue;
            let a = typeof i.splitText == "object" ? i.splitText.mask : void 0;
            for (let c of this.collectTargets(i, t, r)) {
              if (c === document.body) continue;
              let l = o.get(c) || { types: new Set(), masks: new Set() };
              o.set(c, l), l.types.add(s), a && l.masks.add(a);
            }
          }
          return o;
        }
        getSplitTypeString(e) {
          return (
            e.has("chars") && !e.has("words") && (e = new Set([...e, "words"])),
            ["lines", "words", "chars"].filter((o) => e.has(o)).join(", ")
          );
        }
        getMaskString(e) {
          if (e.size !== 0) {
            if (e.has("lines")) return "lines";
            if (e.has("words")) return "words";
            if (e.has("chars")) return "chars";
          }
        }
        doSplitText(e, t, r, o) {
          try {
            let i = Fe(e.type);
            for (let s of t) {
              let a = this.globalSplitRegistry.get(s);
              if (a) {
                let d = new Set(Fe(a.splitTextConfig.type));
                if (i.every((p) => d.has(p))) continue;
                a.splitInstance.revert(),
                  this.globalSplitRegistry.delete(s),
                  (e = {
                    type: [...new Set([...d, ...i])].join(", "),
                    mask: e.mask || a.splitTextConfig.mask,
                  });
              }
              let c = { type: e.type },
                l = Fe(e.type);
              l.includes("lines") &&
                ((r.timeline.data.splitLines = !0),
                (c.linesClass = (0, L.defaultSplitClass)("line")),
                (c.autoSplit = !0),
                (c.onSplit = () => {
                  r.rebuildState !== "init"
                    ? this.scheduleRebuildForElement(s)
                    : (r.rebuildState = "idle");
                })),
                l.includes("words") &&
                  (c.wordsClass = (0, L.defaultSplitClass)("word")),
                l.includes("chars") &&
                  (c.charsClass = (0, L.defaultSplitClass)("letter")),
                e.mask && (c.mask = e.mask);
              let u = new o([s], c);
              this.globalSplitRegistry.set(s, {
                splitInstance: u,
                splitTextConfig: e,
              }),
                a && this.scheduleRebuildForElement(s);
            }
          } catch (i) {
            console.error("Error splitting text:", i);
          }
        }
        scheduleRebuild(e) {
          if (
            e.rebuildState === "building" ||
            e.rebuildState === "rebuild_pending"
          ) {
            e.rebuildState = "rebuild_pending";
            return;
          }
          (e.rebuildState = "building"),
            this.timelineTargetsCache.delete(e),
            this.rebuildTimelineOnTheFly(e);
        }
        rebuildTimelineOnTheFly(e) {
          let t = e.timeline.progress(),
            r = e.controlTypes?.has(bt.TimelineControlType.LOAD) && t !== 1,
            o = e.timeline.isActive() || r;
          e.timeline.pause(), e.timeline.revert(), e.timeline.clear();
          for (let i of e.cleanupFns ?? []) i();
          if (
            (e.cleanupFns?.clear(),
            this.buildTimeline(e),
            e.timeline.progress(t),
            e.scrollTriggerIds && e.scrollTriggerConfigs)
          )
            for (let i of e.scrollTriggerIds) {
              let s = this.scrollTriggers.get(i),
                a = e.scrollTriggerConfigs.get(i);
              if (s && a) {
                let c = { ...a, animation: e.timeline };
                if ((s.kill(), this.env.win.ScrollTrigger)) {
                  let l = this.env.win.ScrollTrigger.create(c);
                  this.scrollTriggers.set(i, l);
                }
              }
            }
          else o && e.timeline.play();
          e.rebuildState === "rebuild_pending"
            ? ((e.rebuildState = "building"), this.rebuildTimelineOnTheFly(e))
            : (e.rebuildState = "idle");
        }
        getStaggerConfig;
        getSplitElements(e, t) {
          let r = [];
          for (let o of e) {
            let i = this.globalSplitRegistry.get(o);
            if (i && Fe(i.splitTextConfig.type).includes(t)) {
              let a = i.splitInstance[t];
              a?.length && r.push(...a);
            }
          }
          return r.length > 0 ? r : e;
        }
        setupScrollControl(e, t, r, o) {
          if (typeof this.env.win.ScrollTrigger > "u") {
            console.warn("ScrollTrigger plugin is not available.");
            return;
          }
          let i = `st_${e}_${t}_${
            o.id || window.crypto.randomUUID().slice(0, 8)
          }`;
          this.cleanupScrollTrigger(i);
          let s = this.getTimeline(e, o);
          if (!s) {
            console.warn(`Timeline ${e} not found`);
            return;
          }
          let a = cs(r, o, i, s, this.resolveFn);
          try {
            let c = this.env.win.ScrollTrigger.create(a);
            this.scrollTriggers.set(i, c);
            let l = this.getSub(e, o);
            l.scrollTriggerIds || (l.scrollTriggerIds = new Set()),
              l.scrollTriggerConfigs || (l.scrollTriggerConfigs = new Map()),
              l.scrollTriggerIds.add(i),
              l.scrollTriggerConfigs.set(i, a);
          } catch (c) {
            console.error("Failed to create ScrollTrigger:", c);
          }
        }
        cleanupScrollTrigger(e) {
          let t = this.scrollTriggers.get(e);
          t && (t.kill(), this.scrollTriggers.delete(e));
        }
        getScrollTriggers() {
          return this.scrollTriggers;
        }
        getTimelineTargets(e) {
          let t = this.timelineTargetsCache.get(e);
          if (t) return t;
          t = new WeakSet();
          for (let r of e.timelineDef.actions ?? [])
            for (let o of this.collectTargets(
              r,
              e.elementContext,
              e.timelineId
            ))
              t.add(o);
          return this.timelineTargetsCache.set(e, t), t;
        }
        scheduleRebuildForElement(e) {
          for (let [, t] of this.subs)
            for (let [, r] of t)
              this.getTimelineTargets(r).has(e) && this.scheduleRebuild(r);
        }
      }),
      fe(oe, "MAX_ALIAS_DEPTH", 10),
      oe);
  function ss(n, e, t) {
    let r = {},
      o = (i) =>
        i && (i.parentElement === document.body || i === document.body);
    if (n.pin !== void 0)
      if (typeof n.pin == "boolean") n.pin && !o(e) && (r.pin = n.pin);
      else {
        let i = t(n.pin, { triggerElement: e });
        i.length > 0 && !o(i[0]) && (r.pin = i[0]);
      }
    if (n.endTrigger) {
      let i = t(n.endTrigger, { triggerElement: e });
      i.length > 0 && (r.endTrigger = i[0]);
    }
    if (n.scroller) {
      let i = t(n.scroller, { triggerElement: e });
      i.length > 0 ? (r.scroller = i[0]) : (r.scroller = window);
    }
    return r;
  }
  function as(n, e) {
    let [t, r, o, i] = n,
      s = (c) => () => {
        if (c !== void 0)
          switch (c) {
            case "play":
              e.play();
              break;
            case "pause":
              e.pause();
              break;
            case "resume":
              e.resume();
              break;
            case "reverse":
              e.reverse();
              break;
            case "restart":
              e.restart();
              break;
            case "reset":
              e.pause(0);
              break;
            case "complete":
              e.progress(1);
              break;
            case "none":
              break;
            default: {
              let l = c;
              break;
            }
          }
      },
      a = {};
    return (
      t !== "none" && (a.onEnter = s(t)),
      r !== "none" && (a.onLeave = s(r)),
      o !== "none" && (a.onEnterBack = s(o)),
      i !== "none" && (a.onLeaveBack = s(i)),
      a
    );
  }
  function cs(n, e, t, r, o) {
    let i = ss(n, e, o),
      s = [
        n.enter || "none",
        n.leave || "none",
        n.enterBack || "none",
        n.leaveBack || "none",
      ],
      a = {
        trigger: e,
        markers: n.showMarkers ?? !1,
        start: n.clamp ? `clamp(${n.start})` : n.start || "top bottom",
        end: n.clamp ? `clamp(${n.end})` : n.end || "bottom top",
        scrub: n.scrub ?? !1,
        horizontal: n.horizontal || !1,
        toggleActions: s.join(" "),
        id: t,
        ...i,
      };
    if (a.scrub !== !1) a.animation = r;
    else {
      let c = as(s, r);
      Object.assign(a, c);
    }
    return a;
  }
  function yr(n) {
    return n.splitText
      ? typeof n.splitText == "string"
        ? n.splitText
        : n.splitText.type
      : "none";
  }
  function Fe(n) {
    return n.split(", ");
  }
});
var br = m((Ct) => {
  "use strict";
  Object.defineProperty(Ct, "__esModule", { value: !0 });
  Object.defineProperty(Ct, "ConditionEvaluator", {
    enumerable: !0,
    get: function () {
      return ls;
    },
  });
  var ge = X(),
    ls = class {
      getConditionEvaluator;
      sharedObservers = new Map();
      conditionCache = new Map();
      CACHE_TTL = 100;
      constructor(e) {
        this.getConditionEvaluator = e;
      }
      evaluateConditionsForTrigger = async (e, t) => {
        if (!e?.length) return !0;
        let r = e.some(([o]) => o === ge.CORE_OPERATORS.OR);
        return this.evaluateCondition(
          [r ? ge.CORE_OPERATORS.OR : ge.CORE_OPERATORS.AND, { conditions: e }],
          t
        );
      };
      observeConditionsForTrigger = (e, t) => {
        if (!e?.length) return () => {};
        let r = [],
          o = [];
        for (let s of e)
          this.getConditionEvaluator(s)?.isReactive ?? !1
            ? r.push(s)
            : o.push(s[0]);
        if (r.length === 0) return () => {};
        let i = r.map((s) => this.getOrCreateSharedObserver(s, t));
        return () => {
          for (let s of i) s();
        };
      };
      disposeSharedObservers = () => {
        for (let [e, t] of this.sharedObservers)
          try {
            t.cleanup();
          } catch (r) {
            console.error("Error disposing shared observer: %s", e, r);
          }
        this.sharedObservers.clear(), this.conditionCache.clear();
      };
      observeCondition = (e, t) => {
        let r = this.getEvaluator(e);
        if (r?.observe)
          try {
            return r.observe(e, t);
          } catch (o) {
            console.error("Error setting up condition observer:", o);
          }
      };
      getEvaluator = (e) => {
        let [t] = e;
        return t === ge.CORE_OPERATORS.AND || t === ge.CORE_OPERATORS.OR
          ? this.getLogicalEvaluator(t)
          : this.getConditionEvaluator(e);
      };
      getLogicalEvaluator = (e) => ({
        evaluate: async (t, r) => {
          let [, o, i] = t,
            { conditions: s } = o || {};
          if (!Array.isArray(s)) return !1;
          if (!s.length) return !0;
          let a = e === ge.CORE_OPERATORS.OR,
            c = i === 1;
          for (let l of s) {
            let u = await this.evaluateCondition(l, r);
            if (a ? u : !u) return a ? !c : !!c;
          }
          return a ? !!c : !c;
        },
        observe: (t, r) => {
          let [, o] = t,
            { conditions: i } = o || {};
          if (!Array.isArray(i)) return () => {};
          let s = i.map((a) =>
            this.observeCondition(a, async () =>
              r(await this.evaluateCondition(t))
            )
          );
          return () => s.forEach((a) => a && a());
        },
      });
      evaluateCondition = async (e, t) => {
        let r = this.generateConditionCacheKey(e, t),
          o = Date.now(),
          i = this.conditionCache.get(r);
        if (i && o - i.timestamp < this.CACHE_TTL) return i.result;
        let s = this.getEvaluator(e);
        if (!s)
          return (
            console.warn(`No evaluator found for condition type '${e[0]}'`), !1
          );
        try {
          let a = await s.evaluate(e, t);
          return this.conditionCache.set(r, { result: a, timestamp: o }), a;
        } catch (a) {
          return console.error("Error evaluating condition:", a), !1;
        }
      };
      generateConditionCacheKey = (e, t) => {
        let [r, o, i] = e,
          s = o ? JSON.stringify(o) : "",
          a = i ? ":negate" : "",
          c = t ? `:ctx:${t.id}` : "";
        return `${r}:${s}${a}${c}`;
      };
      invalidateConditionCache = (e) => {
        let [t] = e,
          r = [];
        for (let o of this.conditionCache.keys())
          o.startsWith(`${t}:`) && r.push(o);
        r.forEach((o) => this.conditionCache.delete(o));
      };
      generateObserverKey = (e) => {
        let [t, r, o] = e,
          i = r ? JSON.stringify(r) : "";
        return `${t}:${i}${o ? ":negate" : ""}`;
      };
      getOrCreateSharedObserver = (e, t) => {
        let r = this.generateObserverKey(e),
          o = this.sharedObservers.get(r);
        if (!o) {
          let i = this.getEvaluator(e);
          if (!i?.observe) return () => {};
          let s = new Set(),
            a = i.observe(e, async () => {
              this.invalidateConditionCache(e);
              let c = Array.from(s, async (l) => {
                try {
                  await l();
                } catch (u) {
                  console.error("Error in shared observer callback:", u);
                }
              });
              await Promise.allSettled(c);
            });
          if (!a) return () => {};
          (o = { cleanup: a, refCount: 0, callbacks: s }),
            this.sharedObservers.set(r, o);
        }
        return (
          o.callbacks.add(t),
          o.refCount++,
          () => this.releaseSharedObserver(r, t)
        );
      };
      releaseSharedObserver = (e, t) => {
        let r = this.sharedObservers.get(e);
        if (
          !(!r || !r.callbacks.delete(t)) &&
          ((r.refCount = Math.max(0, r.refCount - 1)),
          r.refCount <= 0 && r.callbacks.size === 0)
        ) {
          try {
            r.cleanup();
          } catch (i) {
            console.error("Error cleaning up shared observer:", i);
          }
          this.sharedObservers.delete(e);
        }
      };
    };
});
var Tr = m((St) => {
  "use strict";
  Object.defineProperty(St, "__esModule", { value: !0 });
  Object.defineProperty(St, "ConditionalPlaybackManager", {
    enumerable: !0,
    get: function () {
      return ds;
    },
  });
  var us = X(),
    ds = class {
      matchMediaInstances = new Map();
      setupConditionalContext = (e, t, r) => {
        let { conditionalPlayback: o, triggers: i, id: s } = e;
        if (!o || o.length === 0) {
          t(null);
          return;
        }
        this.cleanup(s);
        let a = window.gsap?.matchMedia();
        if (!a) {
          t(null);
          return;
        }
        this.matchMediaInstances.set(s, a);
        let c = !0,
          l = i.some(
            ([, { controlType: u }]) => u === us.TimelineControlType.LOAD
          );
        a.add(this.buildConditionsObject(o), (u) => {
          if (l && !c) return !1;
          c = !1;
          let d = this.evaluateConditions(u.conditions || {}, o);
          return (!d || d.behavior === "skip-to-end") && t(d), r;
        });
      };
      cleanup = (e) => {
        let t = this.matchMediaInstances.get(e);
        t && (t.revert(), this.matchMediaInstances.delete(e));
      };
      destroy = () => {
        for (let [e] of this.matchMediaInstances) this.cleanup(e);
        this.matchMediaInstances.clear();
      };
      buildConditionsObject = (e) => {
        let t = {};
        for (let r of e)
          switch (r.type) {
            case "prefers-reduced-motion": {
              t.prefersReduced = "(prefers-reduced-motion: reduce)";
              break;
            }
            case "breakpoint": {
              (r.breakpoints || []).forEach((i) => {
                let s = fs[i];
                s && (t[`breakpoint_${i}`] = s);
              });
              break;
            }
            default:
              break;
          }
        return (t.fallback = "(min-width: 0px)"), t;
      };
      evaluateConditions(e, t) {
        let r = [];
        for (let s of t)
          s.type === "prefers-reduced-motion" &&
            e.prefersReduced &&
            r.push({ condition: s, type: "prefers-reduced-motion" }),
            s.type === "breakpoint" &&
              (s.breakpoints || []).some((l) => e[`breakpoint_${l}`]) &&
              r.push({ condition: s, type: "breakpoint" });
        if (r.length === 0) return null;
        let o = r.find(({ condition: s }) => s.behavior === "dont-animate");
        if (o)
          return {
            behavior: "dont-animate",
            matchedConditions: {
              prefersReduced: o.type === "prefers-reduced-motion",
              breakpointMatched: o.type === "breakpoint",
            },
          };
        let i = r[0];
        return {
          behavior: i.condition.behavior,
          matchedConditions: {
            prefersReduced: i.type === "prefers-reduced-motion",
            breakpointMatched: i.type === "breakpoint",
          },
        };
      }
    },
    fs = {
      tiny: "(max-width: 479px) and (min-width: 0px)",
      small: "(max-width: 767px) and (min-width: 480px)",
      medium: "(max-width: 991px) and (min-width: 768px)",
      main: "(min-width: 992px)",
    };
});
var Cr = m((Et) => {
  "use strict";
  Object.defineProperty(Et, "__esModule", { value: !0 });
  Object.defineProperty(Et, "PluginRegistry", {
    enumerable: !0,
    get: function () {
      return ps;
    },
  });
  var ps = class {
    plugins = new Map();
    extensionsByPoint = new Map();
    activePlugins = new Set();
    pluginStorage = new Map();
    constructor() {
      ["trigger", "action", "targetResolver", "condition"].forEach((e) =>
        this.extensionsByPoint.set(e, new Map())
      );
    }
    async registerPlugin(e) {
      let t = wr(e.manifest.id);
      if (this.plugins.has(t))
        throw new Error(`Plugin ${t} is already registered`);
      let r = Object.entries(e.manifest.dependencies ?? {});
      for (let [o] of r)
        if (!this.plugins.has(o))
          throw new Error(`Missing dependency: ${o} required by ${t}`);
      this.plugins.set(t, e), e.initialize && (await e.initialize());
      for (let o of e.extensions) this.registerExtension(o);
      r.length || (await this.activatePlugin(t));
    }
    registerExtension(e) {
      this.extensionsByPoint.has(e.extensionPoint) ||
        this.extensionsByPoint.set(e.extensionPoint, new Map());
      let t = this.extensionsByPoint.get(e.extensionPoint),
        r = e.id;
      if (t.has(r))
        throw new Error(
          `Extension ${r} is already registered for point ${e.extensionPoint}`
        );
      t.set(r, e);
    }
    async activatePlugin(e) {
      if (this.activePlugins.has(e)) return;
      let t = this.plugins.get(e);
      if (!t) throw new Error(`Cannot activate unknown plugin: ${e}`);
      let r = Object.keys(t.manifest.dependencies ?? {});
      for (let o of r) await this.activatePlugin(o);
      t.activate && (await t.activate()), this.activePlugins.add(e);
    }
    async deactivatePlugin(e) {
      if (!this.activePlugins.has(e)) return;
      let t = this.plugins.get(e);
      if (!t) throw new Error(`Cannot deactivate unknown plugin: ${e}`);
      t.deactivate && (await t.deactivate()), this.activePlugins.delete(e);
    }
    async unregisterPlugin(e, t) {
      let r = wr([e, t]),
        o = this.plugins.get(r);
      if (o) {
        this.activePlugins.has(r) && (await this.deactivatePlugin(r));
        for (let i of o.extensions)
          i.extensionPoint === "condition" &&
            i.implementation.dispose &&
            (await i.implementation.dispose()),
            this.extensionsByPoint
              .get(i.extensionPoint)
              ?.delete(`${r}:${i.id}`);
        o.dispose && (await o.dispose()),
          this.plugins.delete(r),
          this.pluginStorage.delete(r);
      }
    }
    getExtensions(e) {
      return this.extensionsByPoint.get(e) || new Map();
    }
    getExtensionImpl(e, t) {
      return this.getExtensions(t).get(e)?.implementation;
    }
    getTriggerHandler([e]) {
      return this.getExtensionImpl(e, "trigger");
    }
    getActionHandler(e) {
      return this.getExtensionImpl(e, "action");
    }
    getTargetResolver([e]) {
      return this.getExtensionImpl(e, "targetResolver");
    }
    getConditionEvaluator([e]) {
      return this.getExtensionImpl(e, "condition");
    }
    getAllPlugins() {
      return this.plugins.values();
    }
  };
  function wr(n) {
    return `${n[0]}:${n[1]}`;
  }
});
var Se = m((Mt) => {
  "use strict";
  Object.defineProperty(Mt, "__esModule", { value: !0 });
  Object.defineProperty(Mt, "BaseTriggerStrategy", {
    enumerable: !0,
    get: function () {
      return gs;
    },
  });
  var gs = class {
    runTrigger;
    runTimelineAction;
    skipToEndState;
    constructor(e, t, r) {
      (this.runTrigger = e),
        (this.runTimelineAction = t),
        (this.skipToEndState = r);
    }
  };
});
var Sr = m((At) => {
  "use strict";
  Object.defineProperty(At, "__esModule", { value: !0 });
  Object.defineProperty(At, "StandardTriggerStrategy", {
    enumerable: !0,
    get: function () {
      return ys;
    },
  });
  var hs = Se();
  function ms(n) {
    if (!n || typeof n != "object") return !1;
    let e = n;
    return e.type === "timeline-role" && typeof e.role == "string";
  }
  var ys = class extends hs.BaseTriggerStrategy {
    getTimelineIdsForRole;
    constructor(e, t, r, o) {
      super(e, t, r), (this.getTimelineIdsForRole = o);
    }
    bind(e, t, r) {
      let {
          interactionId: o,
          elements: i,
          triggerHandler: s,
          eventManager: a,
          conditionalContext: c,
          cleanupMap: l,
          delay: u,
        } = r,
        d = e[1],
        f = d.assignedTimelineRole;
      for (let p of i) {
        if (!p) continue;
        let h = l.get(p);
        h || ((h = new Set()), l.set(p, h));
        let g = s(e, p, a, (y) => {
          let E = ms(y) ? y.role : f,
            M = E ? this.getTimelineIdsForRole(t, E) : void 0;
          if (M?.length === 0) return;
          if (c !== null) {
            c.behavior === "skip-to-end" && this.skipToEndState(t, null, d, M);
            return;
          }
          let S = () => {
            this.runTrigger(e, p, o, M).catch((C) =>
              console.error("Error in trigger execution:", C)
            );
          };
          d.conditionalLogic || !u ? S() : setTimeout(S, u * 1e3);
        });
        g && h.add(g);
      }
    }
  };
});
var Er = m((Ot) => {
  "use strict";
  Object.defineProperty(Ot, "__esModule", { value: !0 });
  Object.defineProperty(Ot, "LoadTriggerStrategy", {
    enumerable: !0,
    get: function () {
      return bs;
    },
  });
  var vs = Se(),
    bs = class extends vs.BaseTriggerStrategy {
      loadInteractions;
      getTimeline;
      constructor(e, t, r, o, i) {
        super(e, t, r), (this.loadInteractions = o), (this.getTimeline = i);
      }
      bind(e, t, r) {
        if (window.__wf_ix3) return;
        let { conditionalContext: o, delay: i } = r,
          s = e[1];
        this.loadInteractions.push(() => {
          if (o !== null) {
            o.behavior === "skip-to-end" && this.skipToEndState(t, null);
            return;
          }
          let a = () => {
            for (let c of t.timelineIds ?? []) {
              let l = this.getTimeline(c, null);
              l &&
                (l.data.splitLines
                  ? document.fonts.ready.then(() => {
                      this.runTimelineAction(c, s, null);
                    })
                  : this.runTimelineAction(c, s, null));
            }
          };
          i ? setTimeout(a, i * 1e3) : a();
        });
      }
    };
});
var Mr = m((_t) => {
  "use strict";
  Object.defineProperty(_t, "__esModule", { value: !0 });
  Object.defineProperty(_t, "ScrollTriggerStrategy", {
    enumerable: !0,
    get: function () {
      return ws;
    },
  });
  var Ts = Se(),
    ws = class extends Ts.BaseTriggerStrategy {
      setupScrollControl;
      constructor(e, t, r, o) {
        super(e, t, r), (this.setupScrollControl = o);
      }
      bind(e, t, r) {
        let { interactionId: o, elements: i, conditionalContext: s } = r,
          a = e[1].scrollTriggerConfig;
        if (a) {
          for (let c of i)
            if (c) {
              if (s !== null) {
                s.behavior === "skip-to-end" && this.skipToEndState(t, c);
                continue;
              }
              for (let l of t.timelineIds ?? [])
                this.setupScrollControl(l, o, a, c);
            }
        }
      }
    };
});
var Ar = m((It) => {
  "use strict";
  Object.defineProperty(It, "__esModule", { value: !0 });
  Object.defineProperty(It, "ContinuousChannelManager", {
    enumerable: !0,
    get: function () {
      return Cs;
    },
  });
  var Cs = class {
      coordinator;
      resolveRole;
      channels;
      animation;
      constructor(e, t) {
        (this.coordinator = e),
          (this.resolveRole = t),
          (this.channels = new Map()),
          (this.animation = e.animation);
      }
      isPreviewEnabled() {
        return !(window.__wf_ix3 && window.__wf_ix3_continuous_preview === !1);
      }
      registerChannel(e) {
        let t = this.resolveRole(e.role);
        if (!t)
          return (
            console.warn(
              `IX3 Continuous: Failed to resolve role '${e.role}' to timeline ID. Channel registration skipped.`
            ),
            null
          );
        let r = new Es(
          {
            timelineId: t,
            initialValue: e.initialValue,
            element: e.element,
            smoothing: e.smoothing,
            animation: this.animation,
            isPreviewEnabled: () => this.isPreviewEnabled(),
          },
          this.coordinator
        );
        return this.channels.set(t, r), r;
      }
      fireInterval(e, t) {
        let r = this.resolveRole(e);
        r &&
          this.coordinator.fireInterval(r, t.element ?? null, {
            targetIndex: t.targetIndex,
            pluginPayload: t.pluginPayload,
          });
      }
      registerIntervalHandler(e, t) {
        this.coordinator.registerIntervalHandler(e, t);
      }
      getMetadata(e) {
        let t = this.resolveRole(e);
        return t ? this.coordinator.getTriggerMetadata(t) : null;
      }
      publishChannel(e, t, r) {
        this.coordinator.publishChannel(e, t, r);
      }
      cleanup() {
        for (let e of this.channels.values()) e.destroy();
        this.channels.clear();
      }
    },
    Ss = "power2.out",
    Es = class {
      coordinator;
      proxy;
      setter;
      timelineId;
      element;
      isPreviewEnabled;
      constructor(e, t) {
        (this.coordinator = t),
          (this.proxy = { p: e.initialValue }),
          (this.timelineId = e.timelineId),
          (this.element = e.element ?? null),
          (this.isPreviewEnabled = e.isPreviewEnabled);
        let r = (e.smoothing ?? 0) / 1e3;
        (this.setter =
          r > 0
            ? e.animation.quickTo(this.proxy, "p", {
                duration: r,
                ease: Ss,
                onUpdate: () => this.updateTimeline(this.proxy.p),
              })
            : null),
          this.updateTimeline(e.initialValue);
      }
      setProgress(e) {
        this.setter
          ? this.setter(e)
          : ((this.proxy.p = e), this.updateTimeline(e));
      }
      setImmediate(e) {
        this.setter
          ? this.setter(e, e)
          : ((this.proxy.p = e), this.updateTimeline(e));
      }
      destroy() {
        this.setter?.tween.kill();
      }
      updateTimeline(e) {
        this.isPreviewEnabled() &&
          this.coordinator.setContinuousProgress(
            this.timelineId,
            e,
            this.element
          );
      }
    };
});
var Or = m((Rt) => {
  "use strict";
  Object.defineProperty(Rt, "__esModule", { value: !0 });
  Object.defineProperty(Rt, "ContinuousTriggerStrategy", {
    enumerable: !0,
    get: function () {
      return _s;
    },
  });
  var Ms = Se(),
    As = Ar();
  function Os(n) {
    return n != null && "type" in n && n.type === "continuous";
  }
  var _s = class extends Ms.BaseTriggerStrategy {
    continuousCleanups;
    triggerCleanupFunctions;
    coordinator;
    getTimelineIdForRole;
    constructor(e, t, r, o, i, s, a) {
      super(e, t, r),
        (this.continuousCleanups = o),
        (this.triggerCleanupFunctions = i),
        (this.coordinator = s),
        (this.getTimelineIdForRole = a);
    }
    bind(e, t, r) {
      let {
        interactionId: o,
        elements: i,
        triggerHandler: s,
        conditionalContext: a,
      } = r;
      for (let c of i) {
        if (!c) continue;
        if (a !== null) {
          a.behavior === "skip-to-end" && this.skipToEndState(t, c);
          continue;
        }
        let l = (f) => this.getTimelineIdForRole(t, f),
          u = new As.ContinuousChannelManager(this.coordinator, l),
          d = s(e, c, r.eventManager, (f) => {
            if (Os(f)) {
              let p = f.setup(u),
                h = this.continuousCleanups.get(o);
              h || ((h = new Map()), this.continuousCleanups.set(o, h)),
                h.set(c, () => {
                  p(), u.cleanup();
                });
            }
          });
        if (d) {
          let f = this.triggerCleanupFunctions.get(o);
          f || ((f = new Map()), this.triggerCleanupFunctions.set(o, f));
          let p = f.get(c);
          p || ((p = new Set()), f.set(c, p)), p.add(d);
        }
      }
    }
  };
});
var Ir = m((xt) => {
  "use strict";
  Object.defineProperty(xt, "__esModule", { value: !0 });
  Object.defineProperty(xt, "IX3", {
    enumerable: !0,
    get: function () {
      return js;
    },
  });
  var Ee = X(),
    Is = fr(),
    Rs = vr(),
    xs = br(),
    Ps = Tr(),
    ks = Cr(),
    z = pe(),
    Ns = Sr(),
    Fs = Er(),
    Ls = Mr(),
    Ds = Or(),
    Bs = 200,
    _r = 210,
    he,
    js =
      ((he = class {
        env;
        pluginReg;
        timelineDefs;
        interactions;
        triggeredElements;
        triggerCleanupFunctions;
        continuousCleanups;
        conditionalPlaybackManager;
        triggerStrategies;
        windowSize;
        prevWindowSize;
        windowResizeSubscribers;
        debouncedWindowResize;
        bodyResizeObserver;
        triggerObservers;
        timelineRefCounts;
        interactionTimelineRefs;
        timelineToInteractionId;
        reactiveCallbackQueues;
        debouncedReactiveCallback;
        pendingReactiveUpdates;
        reactiveExecutionContext;
        componentScopeSelectors;
        eventMgr;
        loadInteractions;
        coordinator;
        conditionEval;
        constructor(e) {
          (this.env = e),
            (this.pluginReg = new ks.PluginRegistry()),
            (this.timelineDefs = new Map()),
            (this.interactions = new Map()),
            (this.triggeredElements = new Map()),
            (this.triggerCleanupFunctions = new Map()),
            (this.continuousCleanups = new Map()),
            (this.windowSize = { w: 0, h: 0 }),
            (this.prevWindowSize = { w: 0, h: 0 }),
            (this.windowResizeSubscribers = new Set()),
            (this.debouncedWindowResize = (0, z.debounce)(() => {
              for (let t of this.windowResizeSubscribers) t();
            }, Bs)),
            (this.bodyResizeObserver = null),
            (this.triggerObservers = new Map()),
            (this.timelineRefCounts = new Map()),
            (this.interactionTimelineRefs = new Map()),
            (this.timelineToInteractionId = new Map()),
            (this.reactiveCallbackQueues = new Map()),
            (this.pendingReactiveUpdates = new Map()),
            (this.reactiveExecutionContext = new Set()),
            (this.componentScopeSelectors = new Map()),
            (this.eventMgr = Is.EventManager.getInstance()),
            (this.loadInteractions = []),
            (this.addEventListener = this.eventMgr.addEventListener.bind(
              this.eventMgr
            )),
            (this.emit = this.eventMgr.emit.bind(this.eventMgr)),
            (this.resolveTargets = (t, r, o) => {
              let i = o?.scope?.type === "component" ? o.scope : null,
                s = i?.componentId
                  ? this.getComponentScopeSelector(i.componentId)
                  : null,
                a = i?.variants?.length ? i.variants : null,
                c = this.resolveTargetsImpl(t, r, o, s),
                l =
                  s && r.triggerElement
                    ? this.filterByInstance(c, s, r.triggerElement)
                    : c;
              return a && s ? this.filterByVariant(l, s, a) : l;
            }),
            (this.isTargetDynamic = (t) =>
              !!this.pluginReg.getTargetResolver(t)?.isDynamic),
            (this.getInteractionForTimeline = (t) => {
              let r = this.timelineToInteractionId.get(t);
              if (r) return this.interactions.get(r);
            }),
            window.addEventListener("resize", this.debouncedWindowResize),
            (this.coordinator = new Rs.AnimationCoordinator(
              this.timelineDefs,
              this.pluginReg.getActionHandler.bind(this.pluginReg),
              this.pluginReg.getTargetResolver.bind(this.pluginReg),
              this.resolveTargets,
              this.getInteractionForTimeline,
              e
            )),
            (this.conditionEval = new xs.ConditionEvaluator(
              this.pluginReg.getConditionEvaluator.bind(this.pluginReg)
            )),
            (this.conditionalPlaybackManager =
              new Ps.ConditionalPlaybackManager()),
            (this.triggerStrategies = new Map([
              [
                Ee.TimelineControlType.STANDARD,
                new Ns.StandardTriggerStrategy(
                  this.runTrigger.bind(this),
                  this.runTimelineAction.bind(this),
                  this.skipToEndState.bind(this),
                  this.getTimelineIdsForRole.bind(this)
                ),
              ],
              [
                Ee.TimelineControlType.LOAD,
                new Fs.LoadTriggerStrategy(
                  this.runTrigger.bind(this),
                  this.runTimelineAction.bind(this),
                  this.skipToEndState.bind(this),
                  this.loadInteractions,
                  this.coordinator.getTimeline.bind(this.coordinator)
                ),
              ],
              [
                Ee.TimelineControlType.SCROLL,
                new Ls.ScrollTriggerStrategy(
                  this.runTrigger.bind(this),
                  this.runTimelineAction.bind(this),
                  this.skipToEndState.bind(this),
                  this.coordinator.setupScrollControl.bind(this.coordinator)
                ),
              ],
              [
                Ee.TimelineControlType.CONTINUOUS,
                new Ds.ContinuousTriggerStrategy(
                  this.runTrigger.bind(this),
                  this.runTimelineAction.bind(this),
                  this.skipToEndState.bind(this),
                  this.continuousCleanups,
                  this.triggerCleanupFunctions,
                  this.coordinator,
                  this.getTimelineIdForRole.bind(this)
                ),
              ],
            ])),
            (this.debouncedReactiveCallback = (0, z.debounce)(
              () => this.processPendingReactiveUpdates(),
              16,
              { leading: !1, trailing: !0, maxWait: 100 }
            ));
        }
        getCoordinator() {
          return this.coordinator;
        }
        addEventListener;
        emit;
        static async init(e) {
          return (this.instance = new he(e)), this.instance;
        }
        async registerPlugin(e) {
          await this.pluginReg.registerPlugin(e);
        }
        register(e, t) {
          if (t?.length) for (let r of t) this.timelineDefs.set(r.id, r);
          if (e?.length) {
            for (let r of e) {
              if (this.interactions.has(r.id)) {
                console.warn(
                  `Interaction with ID ${r.id} already exists. Use update() to modify it.`
                );
                continue;
              }
              this.interactions.set(r.id, r);
              let o = new Set();
              this.interactionTimelineRefs.set(r.id, o),
                this.conditionalPlaybackManager.setupConditionalContext(
                  r,
                  (i) => {
                    for (let s of r.timelineIds ?? [])
                      o.add(s),
                        this.incrementTimelineRefCount(s),
                        this.timelineToInteractionId.set(s, r.id),
                        this.coordinator.createTimeline(s, r);
                    for (let s of r.triggers ?? []) this.bindTrigger(s, r, i);
                  },
                  () => {
                    this.cleanupInteractionAnimations(r.id);
                  }
                );
            }
            for (let r of this.loadInteractions) r();
            if (
              ((this.loadInteractions.length = 0),
              this.coordinator.getScrollTriggers().size > 0)
            ) {
              this.windowResizeSubscribers.add(() => {
                (this.windowSize.h = window.innerHeight),
                  (this.windowSize.w = window.innerWidth);
              });
              let r = (0, z.debounce)(
                  () => {
                    (this.prevWindowSize.h = this.windowSize.h),
                      (this.prevWindowSize.w = this.windowSize.w);
                  },
                  _r,
                  { leading: !0, trailing: !1 }
                ),
                o = (0, z.debounce)(() => {
                  if (
                    !(
                      this.windowSize.h !== this.prevWindowSize.h ||
                      this.windowSize.w !== this.prevWindowSize.w
                    )
                  )
                    for (let a of this.coordinator.getScrollTriggers().values())
                      a.refresh();
                }, _r),
                i = (s) => {
                  for (let a of s) a.target === document.body && (r(), o());
                };
              (this.bodyResizeObserver = new ResizeObserver(i)),
                document.body && this.bodyResizeObserver.observe(document.body);
            }
          }
          return this;
        }
        remove(e) {
          let t = Array.isArray(e) ? e : [e];
          for (let r of t) {
            if (!this.interactions.has(r)) {
              console.warn(
                `Interaction with ID ${r} not found, skipping removal.`
              );
              continue;
            }
            this.cleanupTriggerObservers(r),
              this.unbindAllTriggers(r),
              this.cleanupContinuousControlsForInteraction(r);
            let o = this.decrementTimelineReferences(r);
            this.cleanupUnusedTimelines(o),
              this.interactions.delete(r),
              this.triggeredElements.delete(r),
              this.interactionTimelineRefs.delete(r),
              this.conditionalPlaybackManager.cleanup(r);
          }
          return this;
        }
        update(e, t) {
          let r = Array.isArray(e) ? e : [e],
            o = t ? (Array.isArray(t) ? t : [t]) : [];
          o.length && this.register([], o);
          for (let i of r) {
            let { id: s } = i;
            if (!this.interactions.has(s)) {
              console.warn(
                `Interaction with ID ${s} not found, registering as new.`
              ),
                this.register([i], []);
              continue;
            }
            this.remove(s), this.register([i], []);
          }
          return this;
        }
        destroyTimelineInstance(e) {
          this.coordinator.destroy(e);
          let t = `st_${e}_`;
          for (let [r, o] of this.coordinator.getScrollTriggers().entries())
            r.startsWith(t) &&
              (o.kill(), this.coordinator.getScrollTriggers().delete(r));
        }
        cleanupUnusedTimelines(e) {
          for (let t of e)
            this.destroyTimelineInstance(t), this.timelineDefs.delete(t);
        }
        destroy() {
          let e = Array.from(this.interactions.keys());
          this.remove(e),
            (this.loadInteractions.length = 0),
            this.env.win.ScrollTrigger &&
              (this.env.win.ScrollTrigger.getAll().forEach((t) => t.kill()),
              this.bodyResizeObserver?.disconnect(),
              (this.bodyResizeObserver = null)),
            window.removeEventListener("resize", this.debouncedWindowResize),
            this.cleanupAllContinuousControls();
          try {
            this.debouncedReactiveCallback.cancel();
          } catch (t) {
            console.error(
              "Error canceling debounced callback during destroy:",
              t
            );
          }
          this.pendingReactiveUpdates.clear(),
            this.reactiveCallbackQueues.clear(),
            this.reactiveExecutionContext.clear(),
            this.conditionEval.disposeSharedObservers(),
            this.conditionalPlaybackManager.destroy(),
            this.windowResizeSubscribers.clear(),
            this.timelineDefs.clear(),
            this.interactions.clear(),
            this.triggeredElements.clear(),
            this.triggerCleanupFunctions.clear(),
            this.triggerObservers.clear(),
            this.interactionTimelineRefs.clear(),
            this.timelineToInteractionId.clear(),
            this.componentScopeSelectors.clear();
        }
        bindTrigger(e, t, r) {
          let o = t.id,
            i = this.pluginReg.getTriggerHandler(e),
            s = e[1];
          if (!i) {
            console.warn("No trigger handler:", e[0]);
            return;
          }
          let a = this.triggerCleanupFunctions.get(o) || new Map();
          this.triggerCleanupFunctions.set(o, a);
          let { delay: c = 0, controlType: l } = s,
            u = (0, z.toSeconds)(c),
            d = this.eventMgr,
            f = e[2],
            p = [];
          f && (p = this.resolveTargets(f, {}, t));
          let h =
              l && (0, z.isValidControlType)(l)
                ? l
                : Ee.TimelineControlType.STANDARD,
            g = this.triggerStrategies.get(h);
          g
            ? g.bind(e, t, {
                interactionId: o,
                elements: p,
                triggerHandler: i,
                eventManager: d,
                conditionalContext: r,
                cleanupMap: a,
                delay: u || 0,
              })
            : console.warn("No strategy found for control type:", l),
            s.conditionalLogic && this.setupTriggerReactiveMonitoring(e, t);
        }
        setupTriggerReactiveMonitoring(e, t) {
          let { conditionalLogic: r } = e[1];
          if (!r) return;
          let o = `${t.id}:${t.triggers.indexOf(e)}`;
          try {
            let i = this.conditionEval.observeConditionsForTrigger(
                r.conditions,
                async () => {
                  await this.executeReactiveCallbackSafely(
                    t.id,
                    o,
                    async () => {
                      let c =
                        (await this.conditionEval.evaluateConditionsForTrigger(
                          r.conditions,
                          t
                        ))
                          ? r.ifTrue
                          : r.ifFalse;
                      if (c) {
                        let l = this.triggeredElements.get(t.id);
                        if (!l) return;
                        let u = [];
                        for (let d of l)
                          for (let f of t.timelineIds ?? [])
                            u.push({
                              timelineId: f,
                              element: d,
                              action: "pause-reset",
                            });
                        await this.executeTimelineOperationsAsync(u),
                          l.forEach((d) => {
                            this.executeConditionalOutcome(c, d, t);
                          });
                      }
                    }
                  );
                }
              ),
              s = this.triggerObservers.get(t.id);
            s || ((s = new Map()), this.triggerObservers.set(t.id, s)),
              s.set(o, i);
          } catch (i) {
            console.error("Error setting up trigger reactive monitoring:", i);
          }
        }
        async executeReactiveCallbackSafely(e, t, r) {
          this.reactiveExecutionContext.has(t) ||
            (this.pendingReactiveUpdates.set(t, r),
            this.debouncedReactiveCallback());
        }
        async processPendingReactiveUpdates() {
          if (this.pendingReactiveUpdates.size === 0) return;
          let e = new Map(this.pendingReactiveUpdates);
          this.pendingReactiveUpdates.clear();
          let t = new Map();
          for (let [r, o] of e) {
            let i = r.split(":")[0];
            t.has(i) || t.set(i, []),
              t.get(i).push({ triggerKey: r, callback: o });
          }
          for (let [r, o] of t)
            await this.processInteractionReactiveUpdates(r, o);
        }
        async processInteractionReactiveUpdates(e, t) {
          let r = this.reactiveCallbackQueues.get(e);
          if (r)
            try {
              await r;
            } catch (i) {
              console.error("Error waiting for pending reactive callback:", i);
            }
          let o = this.executeInteractionUpdates(t);
          this.reactiveCallbackQueues.set(e, o);
          try {
            await o;
          } finally {
            this.reactiveCallbackQueues.get(e) === o &&
              this.reactiveCallbackQueues.delete(e);
          }
        }
        async executeInteractionUpdates(e) {
          for (let { triggerKey: t, callback: r } of e) {
            this.reactiveExecutionContext.add(t);
            try {
              await r();
            } catch (o) {
              console.error("Error in reactive callback for %s:", t, o);
            } finally {
              this.reactiveExecutionContext.delete(t);
            }
          }
        }
        async executeTimelineOperationsAsync(e) {
          if (e.length)
            return new Promise((t) => {
              Promise.resolve().then(() => {
                e.forEach(({ timelineId: r, element: o, action: i }) => {
                  try {
                    if (!this.timelineDefs.has(r)) {
                      console.warn(
                        `Timeline ${r} not found, skipping operation`
                      );
                      return;
                    }
                    if (!o.isConnected) {
                      console.warn(
                        "Element no longer in DOM, skipping timeline operation"
                      );
                      return;
                    }
                    switch (i) {
                      case "pause-reset":
                        this.coordinator.pause(r, o, 0);
                        break;
                      default:
                        console.warn(`Unknown timeline action: ${i}`);
                    }
                  } catch (s) {
                    console.error(
                      "Error executing timeline operation: %s, %s",
                      i,
                      r,
                      s
                    );
                  }
                }),
                  t();
              });
            });
        }
        getTimelineIdsForRole(e, t) {
          let r = e.timelineIds ?? [],
            o = r.filter(
              (i) => this.timelineDefs.get(i)?.triggerMetadata?.role === t
            );
          if (o.length === 0 && r.length > 0) {
            let i = r
              .map(
                (s) => this.timelineDefs.get(s)?.triggerMetadata?.role || "none"
              )
              .join(", ");
            console.warn(
              `IX3: No timelines found for role '${t}' in interaction '${e.id}'. Available roles: [${i}]`
            );
          }
          return o;
        }
        getTimelineIdForRole(e, t) {
          return this.getTimelineIdsForRole(e, t)[0];
        }
        async runTrigger(e, t, r, o) {
          if (window.__wf_ix3) return;
          let i = e[1],
            s = this.triggeredElements.get(r);
          s || this.triggeredElements.set(r, (s = new Set())), s.add(t);
          let a = this.interactions.get(r);
          if (!a || !a.triggers.includes(e)) return;
          let c = o ?? a.timelineIds ?? [];
          if (i.conditionalLogic)
            try {
              let u = (await this.conditionEval.evaluateConditionsForTrigger(
                i.conditionalLogic.conditions,
                a
              ))
                ? i.conditionalLogic.ifTrue
                : i.conditionalLogic.ifFalse;
              u && this.executeConditionalOutcome(u, t, a, c);
            } catch (l) {
              console.error("Error evaluating trigger conditional logic:", l),
                c.forEach((u) => this.runTimelineAction(u, i, t));
            }
          else c.forEach((l) => this.runTimelineAction(l, i, t));
        }
        skipToEndState(e, t, r, o) {
          (o ?? e.timelineIds ?? []).forEach((s) => {
            let a = this.coordinator.getTimeline(s, t);
            if (!a) return;
            let c = r ? this.getEffectivePlaybackConfig(s, r).control : void 0;
            if (c === "pause" || c === "stop" || c === "none") return;
            let l;
            switch (c) {
              case "reverse":
              case "reverseFlipEase":
                l = 0;
                break;
              case "togglePlayReverse":
                l = Math.round(1 - a.totalProgress());
                break;
              case "resume":
                l = a.reversed() ? 0 : 1;
                break;
              case "play":
              case "restart":
              case void 0:
                l = 1;
                break;
              default: {
                let u = c;
                l = 1;
                break;
              }
            }
            this.coordinator.setTotalProgress(s, l, t ?? null);
          });
        }
        executeConditionalOutcome(e, t, r, o) {
          let {
              control: i,
              targetTimelineId: s,
              speed: a,
              jump: c,
              delay: l = 0,
            } = e,
            u = (0, z.toSeconds)(l);
          if (i === "none") return;
          let d = r.timelineIds ?? [],
            f;
          if (s) {
            if (!d.includes(s)) {
              console.warn(
                `Target timeline '${s}' not found in interaction '${
                  r.id
                }'. Available timelines: ${d.join(", ")}`
              );
              return;
            }
            f = [s];
          } else f = d;
          if (o) {
            let h = new Set(o);
            f = f.filter((g) => h.has(g));
          }
          if (f.length === 0) return;
          let p = () => {
            f.forEach((h) => {
              a !== void 0 && this.coordinator.setTimeScale(h, a, t);
              let g = (0, z.toSeconds)(c);
              switch (i) {
                case "play":
                  this.coordinator.play(h, t, g);
                  break;
                case "pause":
                  this.coordinator.pause(h, t, g);
                  break;
                case "resume":
                  this.coordinator.resume(h, t, g);
                  break;
                case "reverse":
                case "reverseFlipEase":
                  this.coordinator.reverse(h, t, g);
                  break;
                case "restart":
                  this.coordinator.restart(h, t);
                  break;
                case "stop":
                  this.coordinator.pause(h, t, g);
                  break;
                case "togglePlayReverse":
                  this.coordinator.togglePlayReverse(h, t);
                  break;
                default: {
                  this.coordinator.restart(h, t);
                  let y = i;
                  break;
                }
              }
            });
          };
          u
            ? setTimeout(() => {
                p();
              }, u * 1e3)
            : p();
        }
        getEffectivePlaybackConfig(e, t) {
          let r = this.timelineDefs.get(e);
          if (r?.triggerMetadata) {
            let o = r.settings;
            return {
              control: o?.control,
              delay: o?.delay,
              jump: o?.jump,
              speed: o?.speed,
            };
          }
          return {
            control: t.control,
            delay: void 0,
            jump: t.jump,
            speed: t.speed,
          };
        }
        runTimelineAction(e, t, r) {
          let {
              control: o,
              delay: i,
              jump: s,
              speed: a,
            } = this.getEffectivePlaybackConfig(e, t),
            c = this.timelineDefs.get(e);
          if (c?.reuse) {
            let d = c.reuse.sourceTimelineId;
            if (!this.timelineDefs.has(d)) {
              console.warn(
                `Timeline reuse: source '${d}' not found for '${e}'`
              );
              return;
            }
            e = d;
          }
          let l = () => {
              this.coordinator.setTimeScale(e, a ?? 1, r);
              let d = (0, z.toSeconds)(s);
              switch (o) {
                case "play":
                  this.coordinator.play(e, r, d);
                  break;
                case "pause":
                  this.coordinator.pause(e, r, d);
                  break;
                case "resume":
                  this.coordinator.resume(e, r, d);
                  break;
                case "reverse":
                case "reverseFlipEase":
                  this.coordinator.reverse(e, r, d);
                  break;
                case "restart":
                  this.coordinator.restart(e, r);
                  break;
                case "togglePlayReverse":
                  this.coordinator.togglePlayReverse(e, r);
                  break;
                case "stop":
                  this.coordinator.pause(e, r, d);
                  break;
                case "none":
                  break;
                case void 0:
                  this.coordinator.restart(e, r);
                  break;
                default: {
                  let f = o;
                  this.coordinator.restart(e, r);
                  break;
                }
              }
            },
            u = (0, z.toSeconds)(i);
          u && u > 0 ? setTimeout(l, u * 1e3) : l();
        }
        resolveTargets;
        isTargetDynamic;
        getComponentScopeSelector(e) {
          let t = this.componentScopeSelectors.get(e);
          return (
            t ||
              ((t = `[data-wf-component-id="${CSS.escape(e)}"]`),
              this.componentScopeSelectors.set(e, t)),
            t
          );
        }
        resolveTargetsImpl(e, t, r, o) {
          let [i, s, a] = e;
          if (s === "*" && a && a.filterBy) {
            let d = this.resolveUniversalSelectorOptimized(a, t, r, o);
            if (d) return d;
          }
          let c = this.pluginReg.getTargetResolver([i, s]);
          if (!c) return [];
          let l = c.resolve([i, s], t),
            u = o ? this.filterByScope(l, o) : l;
          return !u.length || !a || a.relationship === "none" || !a.filterBy
            ? u
            : this.applyRelationshipFilter(
                u,
                a.relationship,
                this.resolveTargetsImpl(a.filterBy, t, r, o),
                a.firstMatchOnly
              );
        }
        resolveUniversalSelectorOptimized(e, t, r, o) {
          if (!e.filterBy) return null;
          let i = this.resolveTargetsImpl(e.filterBy, t, r, o),
            s = i.length;
          if (!s) return [];
          let a = !!e.firstMatchOnly;
          switch (e.relationship) {
            case "direct-child-of": {
              let c = [];
              for (let l = 0; l < s; l++) {
                let u = i[l];
                if (!u) continue;
                let d = u.children;
                for (let f = 0; f < d.length; f++)
                  if ((c.push(d[f]), a)) return c;
              }
              return c;
            }
            case "within": {
              let c = [];
              for (let l = 0; l < s; l++) {
                let u = i[l];
                if (!u) continue;
                let d = u.querySelectorAll("*");
                for (let f = 0; f < d.length; f++)
                  if ((c.push(d[f]), a)) return c;
              }
              return c;
            }
            case "direct-parent-of": {
              let c = new Set(),
                l = [];
              for (let u = 0; u < s; u++) {
                let d = i[u];
                if (!d) continue;
                let f = d.parentElement;
                if (f && !c.has(f) && (c.add(f), l.push(f), a)) break;
              }
              return o ? this.filterByScope(l, o) : l;
            }
            case "next-sibling-of": {
              let c = [];
              for (let l = 0; l < s; l++) {
                let u = i[l];
                if (!u) continue;
                let d = u.nextElementSibling;
                if (d && (c.push(d), a)) break;
              }
              return o ? this.filterByScope(c, o) : c;
            }
            case "prev-sibling-of": {
              let c = [];
              for (let l = 0; l < s; l++) {
                let u = i[l];
                if (!u) continue;
                let d = u.previousElementSibling;
                if (d && (c.push(d), a)) break;
              }
              return o ? this.filterByScope(c, o) : c;
            }
            case "next-to": {
              let c = new Set(),
                l = [];
              for (let u = 0; u < s; u++) {
                let d = i[u];
                if (!d) continue;
                let f = d.parentElement;
                if (f) {
                  let p = f.children;
                  for (let h = 0; h < p.length; h++) {
                    let g = p[h];
                    if (g !== d && !c.has(g) && (c.add(g), l.push(g), a)) break;
                  }
                  if (a && l.length) break;
                }
              }
              return o ? this.filterByScope(l, o) : l;
            }
            case "contains": {
              let c = new Set(),
                l = [];
              for (let u = 0; u < s; u++) {
                let d = i[u];
                if (!d) continue;
                let f = d.parentElement;
                for (; f && !(c.has(f) || (c.add(f), l.push(f), a)); )
                  f = f.parentElement;
                if (a && l.length) break;
              }
              return o ? this.filterByScope(l, o) : l;
            }
            default:
              return null;
          }
        }
        applyRelationshipFilter(e, t, r, o) {
          if (!e.length || !r.length) return [];
          if (t === "none") return e;
          let i = [],
            s = new Set();
          switch (t) {
            case "direct-child-of": {
              let a = new Set(r);
              for (let c = 0; c < e.length; c++) {
                let l = e[c];
                if (
                  !s.has(l) &&
                  l.parentElement &&
                  a.has(l.parentElement) &&
                  (s.add(l), i.push(l), o)
                )
                  return i;
              }
              return i;
            }
            case "direct-parent-of": {
              let a = new Set();
              for (let c = 0; c < r.length; c++) {
                let l = r[c].parentElement;
                l && a.add(l);
              }
              for (let c = 0; c < e.length; c++) {
                let l = e[c];
                if (!s.has(l) && a.has(l) && (s.add(l), i.push(l), o)) return i;
              }
              return i;
            }
            case "next-sibling-of": {
              let a = new Set(r);
              for (let c = 0; c < e.length; c++) {
                let l = e[c];
                if (s.has(l)) continue;
                let u = l.previousElementSibling;
                if (u && a.has(u) && (s.add(l), i.push(l), o)) return i;
              }
              return i;
            }
            case "prev-sibling-of": {
              let a = new Set(r);
              for (let c = 0; c < e.length; c++) {
                let l = e[c];
                if (s.has(l)) continue;
                let u = l.nextElementSibling;
                if (u && a.has(u) && (s.add(l), i.push(l), o)) return i;
              }
              return i;
            }
            case "next-to": {
              let a = new Set(r),
                c = new Map();
              for (let l = 0; l < r.length; l++) {
                let u = r[l].parentElement;
                u && c.set(u, (c.get(u) ?? 0) + 1);
              }
              for (let l = 0; l < e.length; l++) {
                let u = e[l];
                if (s.has(u) || !u.parentElement) continue;
                let d = c.get(u.parentElement);
                if (d && !(a.has(u) && d <= 1) && (s.add(u), i.push(u), o))
                  return i;
              }
              return i;
            }
            case "within": {
              let a = new Set(r);
              for (let c = 0; c < e.length; c++) {
                let l = e[c];
                if (s.has(l)) continue;
                let u = l.parentElement;
                for (; u; ) {
                  if (a.has(u)) {
                    if ((s.add(l), i.push(l), o)) return i;
                    break;
                  }
                  u = u.parentElement;
                }
              }
              return i;
            }
            case "contains": {
              let a = new Set();
              for (let c = 0; c < r.length; c++) {
                let l = r[c].parentElement;
                for (; l && !a.has(l); ) a.add(l), (l = l.parentElement);
              }
              for (let c = 0; c < e.length; c++) {
                let l = e[c];
                if (!s.has(l) && a.has(l) && (s.add(l), i.push(l), o)) return i;
              }
              return i;
            }
            default:
              return [];
          }
        }
        filterByInstance(e, t, r) {
          if (!e.length) return e;
          let o = r.closest(t);
          if (!o) return e;
          let i = -1;
          for (let a = 0; a < e.length; a++)
            if (e[a]?.closest(t) !== o) {
              i = a;
              break;
            }
          if (i === -1) return e;
          let s = e.slice(0, i);
          for (let a = i + 1; a < e.length; a++) {
            let c = e[a];
            c?.closest(t) === o && s.push(c);
          }
          return s;
        }
        filterByScope(e, t) {
          if (!e.length) return e;
          let r = -1;
          for (let i = 0; i < e.length; i++)
            if (!e[i]?.closest(t)) {
              r = i;
              break;
            }
          if (r === -1) return e;
          let o = e.slice(0, r);
          for (let i = r + 1; i < e.length; i++) {
            let s = e[i];
            s?.closest(t) && o.push(s);
          }
          return o;
        }
        filterByVariant(e, t, r) {
          if (!e.length) return e;
          let o = (a) => {
              let c = a.closest(t);
              if (!c) return !1;
              let l = c.getAttribute("data-wf-variant-state");
              return l != null && r.includes(l);
            },
            i = -1;
          for (let a = 0; a < e.length; a++) {
            let c = e[a];
            if (!c || !o(c)) {
              i = a;
              break;
            }
          }
          if (i === -1) return e;
          let s = e.slice(0, i);
          for (let a = i + 1; a < e.length; a++) {
            let c = e[a];
            c && o(c) && s.push(c);
          }
          return s;
        }
        getInteractionForTimeline;
        incrementTimelineRefCount(e) {
          let t = this.timelineRefCounts.get(e) || 0;
          this.timelineRefCounts.set(e, t + 1);
        }
        decrementTimelineRefCount(e) {
          let t = this.timelineRefCounts.get(e) || 0,
            r = Math.max(0, t - 1);
          return this.timelineRefCounts.set(e, r), r;
        }
        decrementTimelineReferences(e) {
          let t = new Set(),
            r = this.interactionTimelineRefs.get(e);
          if (!r) return t;
          for (let o of r) this.decrementTimelineRefCount(o) === 0 && t.add(o);
          return t;
        }
        unbindAllTriggers(e) {
          let t = this.triggerCleanupFunctions.get(e);
          if (t) {
            for (let [, r] of t)
              for (let o of r)
                try {
                  o();
                } catch (i) {
                  console.error("Error during trigger cleanup:", i);
                }
            this.triggerCleanupFunctions.delete(e);
          }
        }
        cleanupTriggerObservers(e) {
          let t = this.triggerObservers.get(e);
          if (t) {
            for (let [r, o] of t) {
              try {
                o();
              } catch (i) {
                console.error("Error during trigger observer cleanup:", i);
              }
              this.pendingReactiveUpdates.delete(r),
                this.reactiveExecutionContext.delete(r);
            }
            this.reactiveCallbackQueues.delete(e),
              this.triggerObservers.delete(e);
          }
        }
        cleanupContinuousControlsForInteraction(e) {
          let t = this.continuousCleanups.get(e);
          if (t) {
            for (let [, r] of t)
              try {
                r();
              } catch (o) {
                console.error("Error during continuous control cleanup:", o);
              }
            this.continuousCleanups.delete(e);
          }
        }
        cleanupAllContinuousControls() {
          for (let [, e] of this.continuousCleanups)
            for (let [, t] of e)
              try {
                t();
              } catch (r) {
                console.error("Error during continuous control cleanup:", r);
              }
          this.continuousCleanups.clear();
        }
        cleanupInteractionAnimations(e) {
          this.unbindAllTriggers(e),
            this.cleanupContinuousControlsForInteraction(e);
          let t = this.interactionTimelineRefs.get(e);
          if (t)
            for (let r of t)
              this.decrementTimelineRefCount(r) === 0 &&
                this.destroyTimelineInstance(r);
          this.triggeredElements.delete(e);
        }
      }),
      fe(he, "instance"),
      he);
});
var xr = m((Pt) => {
  "use strict";
  Object.defineProperty(Pt, "__esModule", { value: !0 });
  function Vs(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Vs(Pt, {
    EASING_NAMES: function () {
      return qs.EASING_NAMES;
    },
    IX3: function () {
      return Us.IX3;
    },
    convertEaseConfigToGSAP: function () {
      return Rr.convertEaseConfigToGSAP;
    },
    convertEaseConfigToLinear: function () {
      return Rr.convertEaseConfigToLinear;
    },
  });
  var Us = Ir(),
    qs = pe(),
    Rr = mt();
});
var Me = m((Nt) => {
  "use strict";
  Object.defineProperty(Nt, "__esModule", { value: !0 });
  function $s(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  $s(Nt, {
    getScrollY: function () {
      return zs;
    },
    initScrollCache: function () {
      return Gs;
    },
    noop: function () {
      return Hs;
    },
  });
  var Hs = () => {},
    kt = 0,
    Le = 0,
    me = null;
  function Gs() {
    (Le += 1),
      me ||
        ((me = () => {
          kt = window.scrollY;
        }),
        (kt = window.scrollY),
        window.addEventListener("scroll", me, { passive: !0 }));
    let n = !1;
    return () => {
      n ||
        ((n = !0),
        (Le = Math.max(0, Le - 1)),
        Le === 0 &&
          me &&
          (window.removeEventListener("scroll", me), (me = null)));
    };
  }
  function zs() {
    return kt;
  }
});
var Bt = m((Dt) => {
  "use strict";
  Object.defineProperty(Dt, "__esModule", { value: !0 });
  function Ws(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Ws(Dt, {
    COMPONENT_TIMELINE_ROLES: function () {
      return la;
    },
    DEFAULT_MOUSE_FOLLOW_ANCHOR: function () {
      return Qs;
    },
    DEFAULT_MOUSE_MOVE_INTERVAL_DISTANCE: function () {
      return Ks;
    },
    IX3_WF_EXTENSION_KEYS: function () {
      return Ft;
    },
    MOUSE_MOVE_CHANNELS: function () {
      return aa;
    },
    MOUSE_MOVE_TIMELINE_ROLES: function () {
      return Js;
    },
    TIMELINE_ROLE_NAMES: function () {
      return B;
    },
    TargetScope: function () {
      return Lt;
    },
    VELOCITY_CAPABLE_PROPS: function () {
      return Pr;
    },
    canUseVelocityInfluenceProperty: function () {
      return ta;
    },
    getEffectiveFollowMode: function () {
      return Xs;
    },
    getMouseFollowConfig: function () {
      return Ys;
    },
    getMouseMoveTimelineContext: function () {
      return De;
    },
    getOppositeMouseFollowAxis: function () {
      return ia;
    },
    getSingleAxisMouseFollowMode: function () {
      return Zs;
    },
    isMouseMoveIntervalRole: function () {
      return na;
    },
    isVelocityInfluenceEnabled: function () {
      return ea;
    },
    mouseFollowAxisToRole: function () {
      return oa;
    },
    mouseFollowRoleToAxis: function () {
      return ra;
    },
    mouseFollowRoleToSiblingRole: function () {
      return sa;
    },
    narrowMouseMoveIntervalPayload: function () {
      return ca;
    },
  });
  var Ft;
  (function (n) {
    (n.CLASS = "wf:class"),
      (n.BODY = "wf:body"),
      (n.ID = "wf:id"),
      (n.TRIGGER_ONLY = "wf:trigger-only"),
      (n.TRIGGER_ONLY_PARENT = "wf:trigger-only-parent"),
      (n.SELECTOR = "wf:selector"),
      (n.ATTRIBUTE = "wf:attribute"),
      (n.INST = "wf:inst"),
      (n.ANY_ELEMENT = "wf:any-element"),
      (n.VIEWPORT = "wf:viewport"),
      (n.STYLE = "wf:style"),
      (n.TRANSFORM = "wf:transform"),
      (n.LOTTIE = "wf:lottie"),
      (n.SPLINE = "wf:spline"),
      (n.VARIABLE = "wf:variable"),
      (n.RIVE = "wf:rive"),
      (n.ANIMATE_RIVE = "wf:animate-rive"),
      (n.MOUSE_FOLLOW = "wf:mouse-follow"),
      (n.CLICK = "wf:click"),
      (n.HOVER = "wf:hover"),
      (n.LOAD = "wf:load"),
      (n.FOCUS = "wf:focus"),
      (n.BLUR = "wf:blur"),
      (n.SCROLL = "wf:scroll"),
      (n.CUSTOM = "wf:custom"),
      (n.CHANGE = "wf:change"),
      (n.MOUSE_MOVE = "wf:mouse-move"),
      (n.NAVBAR = "wf:navbar"),
      (n.DROPDOWN = "wf:dropdown"),
      (n.PREFERS_REDUCED_MOTION = "wf:prefersReducedMotion"),
      (n.WEBFLOW_BREAKPOINTS = "wf:webflowBreakpoints"),
      (n.CUSTOM_MEDIA_QUERY = "wf:customMediaQuery"),
      (n.COLOR_SCHEME = "wf:colorScheme"),
      (n.ELEMENT_DATA_ATTRIBUTE = "wf:elementDataAttribute"),
      (n.CURRENT_TIME = "wf:currentTime"),
      (n.ELEMENT_STATE = "wf:elementState");
  })(Ft || (Ft = {}));
  var Lt;
  (function (n) {
    (n.ALL = "all"),
      (n.PARENT = "parent"),
      (n.CHILDREN = "children"),
      (n.SIBLINGS = "siblings"),
      (n.NEXT = "next"),
      (n.PREVIOUS = "previous"),
      (n.FIRST_ANCESTOR = "first-ancestor"),
      (n.FIRST_DESCENDANT = "first-descendant"),
      (n.DESCENDANTS = "descendants"),
      (n.ANCESTORS = "ancestors");
  })(Lt || (Lt = {}));
  function Ys(n) {
    let e = n?.properties?.["wf:mouse-follow"];
    if (!(typeof e != "object" || e === null || Array.isArray(e))) return e;
  }
  function Xs(n) {
    return n?.followMode ?? "full";
  }
  function Zs(n) {
    return n === "x" ? "x-only" : "y-only";
  }
  var Qs = "50% 50%",
    Ks = 100,
    B = {
      MOUSE_X: "mouseX",
      MOUSE_Y: "mouseY",
      INTERVAL: "interval",
      OPEN: "open",
      CLOSE: "close",
    };
  function De(n) {
    return n === B.MOUSE_X
      ? { kind: "mouse-x", role: n, axis: "x", siblingRole: B.MOUSE_Y }
      : n === B.MOUSE_Y
      ? { kind: "mouse-y", role: n, axis: "y", siblingRole: B.MOUSE_X }
      : n === B.INTERVAL
      ? { kind: "interval", role: n }
      : { kind: "other", role: n ?? void 0 };
  }
  var Js = {
      MOUSE_X: { role: B.MOUSE_X, label: "Mouse X" },
      MOUSE_Y: { role: B.MOUSE_Y, label: "Mouse Y" },
      INTERVAL: { role: B.INTERVAL, label: "Interval" },
    },
    Pr = new Set([
      "x",
      "y",
      "scale",
      "scaleX",
      "scaleY",
      "rotation",
      "skewX",
      "skewY",
      "opacity",
    ]);
  function ea(n) {
    return (
      n?.pluginConfig?.type === "mouseMove" &&
      !!n.pluginConfig.velocityInfluence
    );
  }
  function ta(n) {
    return Pr.has(n);
  }
  function na(n) {
    return De(n).kind === "interval";
  }
  function ra(n) {
    let e = De(n);
    return e.kind === "mouse-x" || e.kind === "mouse-y" ? e.axis : null;
  }
  function ia(n) {
    return n === "x" ? "y" : "x";
  }
  function oa(n) {
    return n === "x" ? B.MOUSE_X : B.MOUSE_Y;
  }
  function sa(n) {
    let e = De(n);
    return e.kind === "mouse-x" || e.kind === "mouse-y" ? e.siblingRole : null;
  }
  var aa = { POSITION: "wf:mouse-move:position", LEAVE: "wf:mouse-move:leave" };
  function ca(n) {
    if (typeof n != "object" || n === null) return {};
    let e = n,
      t = {},
      r = e.cursorPos;
    return (
      typeof r == "object" &&
        r !== null &&
        typeof r.x == "number" &&
        typeof r.y == "number" &&
        (t.cursorPos = { x: r.x, y: r.y }),
      typeof e.velocityFactor == "number" &&
        (t.velocityFactor = e.velocityFactor),
      typeof e.dirX == "number" && (t.dirX = e.dirX),
      typeof e.dirY == "number" && (t.dirY = e.dirY),
      t
    );
  }
  var la = {
    OPEN: {
      role: B.OPEN,
      label: "Open",
      allowedControls: ["play", "restart"],
      defaultControl: "play",
    },
    CLOSE: {
      role: B.CLOSE,
      label: "Close",
      allowedControls: ["play", "restart", "reverse", "reverseFlipEase"],
      allowedControlsWhenReusing: ["reverse", "reverseFlipEase"],
      defaultControl: "play",
      defaultControlWhenReusing: "reverseFlipEase",
      autoReusesRole: B.OPEN,
    },
  };
});
var Dr = m((Ut) => {
  "use strict";
  Object.defineProperty(Ut, "__esModule", { value: !0 });
  function ua(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  ua(Ut, {
    createLoadedMouseFollowActionNormalizer: function () {
      return va;
    },
    forTestSuite: function () {
      return ba;
    },
    getGroupedMouseFollowConfig: function () {
      return Vt;
    },
    getUnpairedMouseFollowAction: function () {
      return pa;
    },
    getUnpairedMouseFollowConfig: function () {
      return kr;
    },
    remapMouseFollowActionGroupsInTimelines: function () {
      return ya;
    },
    setGroupedMouseFollowActionConfig: function () {
      return fa;
    },
    setMouseFollowActionConfig: function () {
      return Nr;
    },
    stripMouseFollowActionInstanceIds: function () {
      return ga;
    },
    stripMouseFollowConfigInstanceIds: function () {
      return jt;
    },
  });
  var Be = Bt();
  function jt(n) {
    let { groupId: e, syncedActionId: t, ...r } = n;
    return r;
  }
  function da(n, e) {
    return { ...jt(n), groupId: e };
  }
  function Vt(n, e, t) {
    let r = da(n, e);
    return (
      t?.axis !== void 0 && (r.axis = t.axis),
      t?.followMode !== void 0 && (r.followMode = t.followMode),
      r
    );
  }
  function kr(n, e = n.axis) {
    let { syncedActionId: t, ...r } = n,
      o =
        r.followMode === "full" && e
          ? (0, Be.getSingleAxisMouseFollowMode)(e)
          : r.followMode;
    return { ...r, ...(o !== void 0 ? { followMode: o } : {}) };
  }
  function je(n, e) {
    let t = (0, Be.getMouseFollowConfig)(n);
    if (!t) return n;
    let r = e(t);
    return r === t
      ? n
      : {
          ...n,
          properties: {
            ...n.properties,
            [Be.IX3_WF_EXTENSION_KEYS.MOUSE_FOLLOW]: r,
          },
        };
  }
  function Nr(n, e) {
    return {
      ...n,
      properties: {
        ...n.properties,
        [Be.IX3_WF_EXTENSION_KEYS.MOUSE_FOLLOW]: e,
      },
    };
  }
  function fa(n, e, t, r) {
    return Nr(n, Vt(e, t, r));
  }
  function pa(n, e) {
    return je(n, (t) => kr(t, e));
  }
  function ga(n) {
    return je(n, jt);
  }
  function ha(n, e, t) {
    return t[e] ? [n, e].sort().join(":") : `single:${n}`;
  }
  function ma(n, e, t) {
    return (
      e.groupId ??
      (e.syncedActionId ? ha(n, e.syncedActionId, t) : `single:${n}`)
    );
  }
  function Fr(n, e) {
    let t = {};
    return (r, o = r.id) =>
      je(r, (i) => {
        let s = ma(o, i, e),
          a = t[s] ?? n(s);
        return (t[s] = a), Vt(i, a);
      });
  }
  function Lr(n, e, t) {
    let r = t ?? Object.fromEntries(n.map((i) => [i.id, i.id])),
      o = Fr(() => e(), r);
    return (i, s) => o(i, s ?? i.id);
  }
  function ya(
    n,
    { generateGroupId: e, actionIdMap: t, mapAction: r = (o) => o }
  ) {
    let o = Lr(
      n.flatMap((i) => i.actions ?? []),
      e,
      t
    );
    return n.map((i) => {
      let s = !1,
        a = i.actions?.map((c) => {
          let l = c.id,
            u = r(c),
            d = o(u, l);
          return (s = s || d !== c), d;
        });
      return s && a ? { ...i, actions: a } : i;
    });
  }
  function va(n) {
    let e = Object.fromEntries(n.map((r) => [r.id, r.id])),
      t = Fr((r) => r, e);
    return (r, o) => {
      let i = t(r);
      return o ? je(i, (s) => (s.axis ? s : { ...s, axis: o })) : i;
    };
  }
  var ba = { createMouseFollowActionGroupRemapper: Lr };
});
var jr = m((qt) => {
  "use strict";
  Object.defineProperty(qt, "__esModule", { value: !0 });
  function Ta(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Ta(qt, {
    TRANSIENT_IX3_CLONE_ATTR: function () {
      return Br;
    },
    isTransientIX3Clone: function () {
      return wa;
    },
  });
  var Br = "data-ix3-clone",
    wa = (n) => !!n.closest?.(`[${Br}]`);
});
var te = m((ye) => {
  "use strict";
  Object.defineProperty(ye, "__esModule", { value: !0 });
  Object.defineProperty(ye, "CORE_PLUGIN_INFO", {
    enumerable: !0,
    get: function () {
      return Ca;
    },
  });
  $t(Bt(), ye);
  $t(Dr(), ye);
  $t(jr(), ye);
  function $t(n, e) {
    return (
      Object.keys(n).forEach(function (t) {
        t !== "default" &&
          !Object.prototype.hasOwnProperty.call(e, t) &&
          Object.defineProperty(e, t, {
            enumerable: !0,
            get: function () {
              return n[t];
            },
          });
      }),
      n
    );
  }
  var Ca = { namespace: "wf", pluginId: "core", version: "1.0.0" };
});
var Ur = m((Ht) => {
  "use strict";
  Object.defineProperty(Ht, "__esModule", { value: !0 });
  Object.defineProperty(Ht, "TouchScrollGuard", {
    enumerable: !0,
    get: function () {
      return Ea;
    },
  });
  var Vr = Me();
  function Sa(n) {
    let e = n;
    for (; e && e !== document.body && e !== document.documentElement; ) {
      if (e instanceof HTMLElement) {
        let t = getComputedStyle(e).overflowY;
        if (
          (t === "auto" || t === "scroll" || t === "overlay") &&
          e.scrollHeight > e.clientHeight
        )
          return e;
      }
      e = e.parentElement;
    }
    return null;
  }
  var Ea = class {
    isScrolling = !1;
    toleranceDeg;
    refX = 0;
    refY = 0;
    lastY = 0;
    locked = null;
    effectFromBoundary = !1;
    scroller = null;
    maxScroll = 0;
    constructor(e, t, r) {
      this.toleranceDeg = r?.tolerance ?? 18;
      let o = (0, Vr.initScrollCache)();
      t.addEventListener("abort", o);
      let i = (c) => {
          let l = c.touches[0];
          l &&
            ((this.refX = l.clientX),
            (this.refY = l.clientY),
            (this.lastY = l.clientY),
            (this.locked = null),
            (this.effectFromBoundary = !1),
            (this.isScrolling = !1),
            (this.scroller = Sa(c.target ?? e)),
            (this.maxScroll = this.scroller
              ? this.scroller.scrollHeight - this.scroller.clientHeight
              : document.documentElement.scrollHeight - window.innerHeight));
        },
        s = (c) => {
          let l = c.touches[0];
          if (!l) return;
          let u = l.clientY,
            d = l.clientX - this.refX,
            f = u - this.refY,
            p = u > this.lastY,
            h = u < this.lastY,
            g = this.scroller ? this.scroller.scrollTop : (0, Vr.getScrollY)(),
            y = this.maxScroll,
            E = g <= 1 && p,
            M = y > 0 && g >= y - 1 && h;
          this.locked === null && this.decide(d, f, E || M),
            this.locked === "scroll" &&
              (E || M) &&
              ((this.refX = l.clientX),
              (this.refY = u),
              (this.locked = "effect"),
              (this.effectFromBoundary = !0)),
            this.locked === "effect" &&
              this.effectFromBoundary &&
              !(E || M) &&
              ((this.refX = l.clientX),
              (this.refY = u),
              (this.locked = null),
              (this.effectFromBoundary = !1)),
            (this.lastY = u),
            (this.isScrolling =
              this.locked === "scroll" ||
              this.locked === null ||
              (this.locked === "effect" && !c.cancelable && !(E || M))),
            this.locked === "effect" && c.cancelable && c.preventDefault();
        },
        a = () => {
          (this.locked = null), (this.isScrolling = !1);
        };
      e.addEventListener("touchstart", i, { passive: !0, signal: t }),
        e.addEventListener("touchmove", s, { passive: !1, signal: t }),
        e.addEventListener("touchend", a, { passive: !0, signal: t }),
        e.addEventListener("touchcancel", a, { passive: !0, signal: t });
    }
    decide(e, t, r) {
      if (Math.abs(e) < 10 && Math.abs(t) < 10) return;
      Math.atan2(Math.abs(e), Math.abs(t)) * (180 / Math.PI) > this.toleranceDeg
        ? ((this.locked = "effect"), (this.effectFromBoundary = !1))
        : r
        ? ((this.locked = "effect"), (this.effectFromBoundary = !0))
        : (this.locked = "scroll");
    }
  };
});
var qr = m((Gt) => {
  "use strict";
  Object.defineProperty(Gt, "__esModule", { value: !0 });
  Object.defineProperty(Gt, "VelocityController", {
    enumerable: !0,
    get: function () {
      return Ia;
    },
  });
  var Ma = {
    adaptiveMax: 2800,
    adaptAlpha: 0.05,
    adaptDecay: 0.99,
    hardMin: 600,
    hardMax: 4e3,
  };
  function Aa(n, e) {
    let t = Math.max(e.hardMin, Math.min(e.hardMax, n));
    (e.adaptiveMax = Math.max(t, e.adaptiveMax * e.adaptDecay)),
      (e.adaptiveMax += (t - e.adaptiveMax) * e.adaptAlpha),
      (e.adaptiveMax = Math.max(e.hardMin, Math.min(e.hardMax, e.adaptiveMax)));
  }
  var Oa = (n) => n * n;
  function _a(n, e, t, r) {
    let o = Math.hypot(n, e);
    Aa(o, t);
    let i = Math.max(1, t.adaptiveMax),
      s = Oa(Math.min(1, o / i)),
      a = 0,
      c = 0;
    return (
      r.x && r.y
        ? o > 0 && ((a = n / o), (c = e / o))
        : r.x
        ? n !== 0 && (a = Math.sign(n))
        : r.y && e !== 0 && (c = Math.sign(e)),
      { n: s, dirX: a, dirY: c }
    );
  }
  var Ia = class {
    config;
    velState;
    lastDirX;
    lastDirY;
    lastNormVelocity;
    get dirX() {
      return this.lastDirX;
    }
    get dirY() {
      return this.lastDirY;
    }
    constructor(e) {
      (this.config = e),
        (this.velState = { ...Ma }),
        (this.lastDirX = 0),
        (this.lastDirY = 0),
        (this.lastNormVelocity = 0);
    }
    update(e, t) {
      let {
        n: r,
        dirX: o,
        dirY: i,
      } = _a(e, t, this.velState, this.config.axes);
      (this.lastNormVelocity = r), (this.lastDirX = o), (this.lastDirY = i);
    }
    reset() {
      (this.lastDirX = 0), (this.lastDirY = 0), (this.lastNormVelocity = 0);
    }
    destroy() {
      this.reset();
    }
  };
});
var $r = m((zt) => {
  "use strict";
  Object.defineProperty(zt, "__esModule", { value: !0 });
  Object.defineProperty(zt, "IntervalController", {
    enumerable: !0,
    get: function () {
      return Pa;
    },
  });
  var Ra = te(),
    xa = 16,
    Pa = class {
      config;
      accum;
      lastX;
      lastY;
      initialized;
      cycleIndex;
      destroyed;
      constructor(e) {
        (this.config = e),
          (this.accum = 0),
          (this.lastX = 0),
          (this.lastY = 0),
          (this.initialized = !1),
          (this.cycleIndex = 0),
          (this.destroyed = !1),
          document.addEventListener(
            "visibilitychange",
            () => {
              document.visibilityState === "visible" && this.reset();
            },
            { signal: this.config.signal }
          );
      }
      get isActive() {
        return this.config.distance > 0;
      }
      update(e) {
        if (this.destroyed || !this.isActive) return;
        let { x: t, y: r, velocityFactor: o, dirX: i, dirY: s } = e;
        if (!this.initialized) {
          (this.lastX = t), (this.lastY = r), (this.initialized = !0);
          return;
        }
        let a = t - this.lastX,
          c = r - this.lastY;
        (this.lastX = t), (this.lastY = r);
        let { axes: l, distance: u } = this.config;
        l.x && l.y
          ? (this.accum += Math.hypot(a, c))
          : l.x
          ? (this.accum += Math.abs(a))
          : l.y && (this.accum += Math.abs(c));
        let d = 0;
        for (; this.accum >= u && d < xa; ) {
          this.accum -= u;
          let f = {
            cursorPos: { x: t, y: r },
            velocityFactor: o,
            dirX: i,
            dirY: s,
          };
          this.config.channelManager.fireInterval?.(
            Ra.TIMELINE_ROLE_NAMES.INTERVAL,
            {
              targetIndex: this.cycleIndex++,
              element: this.config.element,
              pluginPayload: f,
            }
          ),
            d++;
        }
        this.accum >= u && (this.accum %= u);
      }
      reset() {
        (this.accum = 0), (this.initialized = !1), (this.cycleIndex = 0);
      }
      destroy() {
        (this.destroyed = !0), this.reset();
      }
    };
});
var Ve = m((Wt) => {
  "use strict";
  Object.defineProperty(Wt, "__esModule", { value: !0 });
  function ka(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  ka(Wt, {
    TRANSIENT_IX3_CLONE_ATTR: function () {
      return Hr.TRANSIENT_IX3_CLONE_ATTR;
    },
    isTransientIX3Clone: function () {
      return Hr.isTransientIX3Clone;
    },
  });
  var Hr = te();
});
var Kr = m((Xt) => {
  "use strict";
  Object.defineProperty(Xt, "__esModule", { value: !0 });
  Object.defineProperty(Xt, "fireMouseMoveInterval", {
    enumerable: !0,
    get: function () {
      return Ha;
    },
  });
  var Na = te(),
    Qr = Ve(),
    Yt = new Set(["x", "y"]),
    Fa = new Set(["scale", "scaleX", "scaleY"]),
    Gr = new WeakMap(),
    zr = new WeakMap();
  function La(n) {
    let e = Gr.get(n);
    return (
      e ||
        ((e = {
          activeIntervalEls: new Map(),
          intervalClones: new Set(),
          baselineValues: new Map(),
        }),
        Gr.set(n, e)),
      e
    );
  }
  function Da(n, e, t, r) {
    let o = zr.get(n);
    o || ((o = new Set()), zr.set(n, o)),
      !o.has(t) &&
        (o.add(t),
        r(() => {
          let i = e.activeIntervalEls.get(t);
          if (i)
            for (let s of i)
              e.intervalClones.has(s) &&
                (s.isConnected && s.remove(), e.intervalClones.delete(s));
          e.activeIntervalEls.delete(t),
            e.baselineValues.delete(t),
            o.delete(t);
        }));
  }
  function Wr(n) {
    if (n)
      for (let e in n) {
        if (!Yt.has(e)) continue;
        let t = n[e];
        (typeof t == "number" || typeof t == "string") && (n[e] = `+=${t}`);
      }
  }
  function Yr(n, e, t, r) {
    if (n)
      for (let o in n) {
        let i = n[o],
          s,
          a = "";
        if (typeof i == "number") s = i;
        else if (typeof i == "string") {
          if (((s = parseFloat(i)), isNaN(s))) continue;
          a = i.replace(/^-?[\d.]+/, "");
        } else continue;
        if (Yt.has(o)) {
          let c = o === "y" ? r : t;
          n[o] = `+=${s * e * c}${a}`;
        } else if (o === "rotation") {
          let c = Math.abs(t) >= Math.abs(r) ? t : -r;
          n[o] = s * e * c;
        } else Fa.has(o) ? (n[o] = 1 + (s - 1) * e) : (n[o] = s * e);
      }
  }
  function Ba(n, e) {
    let t = n.getOneShotTimelineContext(e),
      r = t?.timelineDef;
    if (!t || !r?.actions?.length) return null;
    let o = r.triggerMetadata,
      i = o?.pluginConfig?.type === "mouseMove" ? o.pluginConfig : void 0;
    return o?.role !== "interval" && !i
      ? null
      : {
          oneShot: t,
          mouseMoveMeta: i ?? { type: "mouseMove" },
          axes: o?.axes,
        };
  }
  function ja(n, e, t, r, o) {
    let i = n.cloneNode(!0);
    i.removeAttribute("style"),
      i.removeAttribute("id"),
      i.removeAttribute("data-w-id"),
      i.setAttribute(Qr.TRANSIENT_IX3_CLONE_ATTR, "true"),
      (i.style.position = "absolute"),
      (i.style.margin = "0"),
      (i.style.pointerEvents = "none"),
      n.insertAdjacentElement("beforebegin", i);
    let s = e.baselineValues.get(o)?.get(n);
    return s && r.set(i, { ...s }), e.intervalClones.add(i), t.add(i), i;
  }
  function Va(n, e) {
    let t = [],
      r = new Set();
    for (let o of n.timelineDef.actions)
      for (let i in o.properties) {
        let s = n.getActionTweenConfig(o, i, [e]);
        if (s) {
          for (let a of [s.to, s.from])
            if (a)
              for (let c of Object.keys(a)) Yt.has(c) ? t.push(c) : r.add(c);
        }
      }
    return { clearProps: t, baselineProps: r };
  }
  function Ua(n, e, t, r, o) {
    let { clearProps: i, baselineProps: s } = Va(n, t);
    if (s.size > 0) {
      let a = {};
      for (let l of s) a[l] = e.getProperty(t, l);
      let c = r.baselineValues.get(o);
      c || ((c = new WeakMap()), r.baselineValues.set(o, c)), c.set(t, a);
    }
    i.length !== 0 && e.set(t, { clearProps: i.join(",") });
  }
  function qa(n, e, t) {
    return (r, o, i) => {
      (
        o.pluginConfig?.type === "mouseMove"
          ? o.pluginConfig.velocityInfluence
          : !1
      )
        ? n != null && (Yr(i.to, n, e, t), i.from && Yr(i.from, n, e, t))
        : (Wr(i.to), i.from && Wr(i.from));
    };
  }
  function $a(n, e, t, r, o, i, s, a) {
    let [c] = t;
    if (c && (n.set(c, { zIndex: r + 1 + o }, 0), !(!i || (!s && !a))))
      for (let l of t) {
        let u = l.getBoundingClientRect(),
          d = {};
        if (s) {
          let f = Number(e.getProperty(l, "x")) || 0;
          d.x = i.x - (u.left + u.width / 2 - f);
        }
        if (a) {
          let f = Number(e.getProperty(l, "y")) || 0;
          d.y = i.y - (u.top + u.height / 2 - f);
        }
        n.set(l, d, 0);
      }
  }
  function Xr(n) {
    for (let e of n) e();
    n.clear();
  }
  function Zr(n, e, t) {
    n.activeIntervalEls.get(e)?.delete(t),
      n.intervalClones.has(t) &&
        (t.isConnected && t.remove(), n.intervalClones.delete(t));
  }
  var Ha = ({
    coordinator: n,
    timelineId: e,
    element: t,
    options: r,
    animation: o,
  }) => {
    if (!o.hasGsap()) return;
    let i = r.targetIndex;
    if (i == null) return;
    let s = Ba(n, e);
    if (!s) return;
    let { oneShot: a, mouseMoveMeta: c, axes: l } = s,
      u = La(n),
      d = a
        .getFirstActionTargets(t)
        .filter((j) => !(0, Qr.isTransientIX3Clone)(j));
    if (!d.length) return;
    let f = [d[i % d.length]],
      p = f,
      h = f[0],
      g = u.activeIntervalEls.get(e);
    g || ((g = new Set()), u.activeIntervalEls.set(e, g)),
      g.has(h) ? (p = [ja(h, u, g, o, e)]) : (Ua(a, o, h, u, e), g.add(h));
    let y = p[0],
      E = l?.x === !1 && l?.y === !1,
      M = E || (l?.x ?? c?.setMouseX ?? !0),
      S = E || (l?.y ?? c?.setMouseY ?? !0),
      C = (0, Na.narrowMouseMoveIntervalPayload)(r.pluginPayload),
      v = C.cursorPos,
      T = C.velocityFactor,
      w = C.dirX ?? 0,
      _ = C.dirY ?? 0,
      I = new Set(),
      x = a.buildActionTimeline({
        targets: p,
        cleanupBucket: I,
        varsTransform: qa(T, w, _),
        beforeTweens: (j) => {
          $a(j, o, p, d.length, i, v, M, S);
        },
      });
    if (!x) {
      Xr(I), Zr(u, e, y);
      return;
    }
    let G = null,
      R = !1,
      A = (j) => {
        R || ((R = !0), G?.(), j && x.kill(), Xr(I), Zr(u, e, y));
      };
    (G = a.registerCleanup(() => A(!0))),
      x.eventCallback("onComplete", () => {
        A(!1);
      }),
      Da(n, u, e, a.registerCleanup);
  };
});
var ii = m((Kt) => {
  "use strict";
  Object.defineProperty(Kt, "__esModule", { value: !0 });
  Object.defineProperty(Kt, "buildMouseMove", {
    enumerable: !0,
    get: function () {
      return ec;
    },
  });
  var ne = te(),
    Ae = Me(),
    Ga = Ur(),
    za = qr(),
    Wa = $r(),
    Ya = Kr(),
    Xa = 50,
    Jr = 50,
    Zt = null;
  function Za() {
    return (
      Zt === null &&
        (Zt = "ontouchstart" in window || navigator.maxTouchPoints > 0),
      Zt
    );
  }
  var ni = 0,
    ri = 0,
    Ue = 0,
    se = null;
  function Qa() {
    (Ue += 1),
      se ||
        ((se = () => {
          (ni = window.innerWidth), (ri = window.innerHeight);
        }),
        se(),
        window.addEventListener("resize", se));
    let n = !1;
    return () => {
      n ||
        ((n = !0),
        (Ue = Math.max(0, Ue - 1)),
        Ue === 0 &&
          se &&
          (window.removeEventListener("resize", se), (se = null)));
    };
  }
  var qe = (n) => Math.max(0, Math.min(1, n));
  function Ka(n, e, t) {
    return e === t || n === t || (n < t && e > t) || (n > t && e < t);
  }
  function Oe(n, e, t) {
    let r = n.tween;
    (n.tween = null),
      (n.takeoverTarget = null),
      (n.proxy.value = e),
      (n.lastValue = e),
      n.channel?.setProgress(e),
      t && r?.kill();
  }
  function ei(n, e) {
    if (n.tween) {
      if (n.proxy.value === e) {
        Oe(n, e, !0);
        return;
      }
      let t = n.tweenTarget - n.proxy.value,
        r = e - n.proxy.value;
      if (t * r < 0) {
        Oe(n, e, !0);
        return;
      }
      n.takeoverTarget = e;
      return;
    }
    (n.proxy.value = e), (n.lastValue = e), n.channel?.setProgress(e);
  }
  function Qt(n) {
    let e = n.tween;
    (n.tween = null), (n.takeoverTarget = null), e?.kill();
  }
  function ti(n, e, t, r) {
    Qt(e), (e.lastValue = e.proxy.value), (e.tweenTarget = t);
    let o = n.to(e.proxy, {
      value: t,
      duration: r,
      ease: "power2.out",
      onUpdate: () => {
        let i = e.proxy.value,
          s = e.takeoverTarget;
        if (s != null && Ka(e.lastValue, i, s)) {
          Oe(e, s, !0);
          return;
        }
        (e.lastValue = i), e.channel?.setImmediate(i);
      },
      onComplete: () => {
        let i = e.takeoverTarget;
        (e.tween = null), (e.takeoverTarget = null), i != null && Oe(e, i, !1);
      },
    });
    if (!o) {
      Oe(e, t, !1);
      return;
    }
    e.tween = o;
  }
  function Ja(n, e, t, r) {
    let o = Math.abs(t - n),
      i = Math.abs(r - e),
      s = Math.max(o, i);
    return 0.1 + Math.min(s / 0.5, 1) * 0.5;
  }
  function ec(n) {
    n.addTrigger("mouse-move", (e, t, r, o) => {
      let i = e[1].pluginConfig,
        s = e[2]?.[0] === ne.IX3_WF_EXTENSION_KEYS.VIEWPORT;
      return (
        o({
          type: "continuous",
          setup: (a) => {
            let { animation: c } = a;
            if (!c.hasGsap() || !c.hasObserver()) return Ae.noop;
            let l = s ? Qa() : Ae.noop;
            a.registerIntervalHandler(
              ne.IX3_WF_EXTENSION_KEYS.MOUSE_MOVE,
              Ya.fireMouseMoveInterval
            );
            let u = i?.smoothness ?? Xa,
              d = (i?.restingState?.x ?? Jr) / 100,
              f = (i?.restingState?.y ?? Jr) / 100,
              p = a.registerChannel({
                role: ne.TIMELINE_ROLE_NAMES.MOUSE_X,
                initialValue: d,
                element: t,
                smoothing: u,
              }),
              h = a.registerChannel({
                role: ne.TIMELINE_ROLE_NAMES.MOUSE_Y,
                initialValue: f,
                element: t,
                smoothing: u,
              }),
              g = new AbortController(),
              { signal: y } = g,
              E = a.getMetadata(ne.TIMELINE_ROLE_NAMES.INTERVAL),
              M = {
                x: E?.axes?.x !== !1 || E?.axes?.y === !1,
                y: E?.axes?.y !== !1 || E?.axes?.x === !1,
              },
              S = E
                ? new Wa.IntervalController({
                    distance:
                      E.distance ?? ne.DEFAULT_MOUSE_MOVE_INTERVAL_DISTANCE,
                    axes: M,
                    channelManager: a,
                    element: t,
                    signal: y,
                  })
                : null,
              C = S ? new za.VelocityController({ axes: M }) : null,
              v = {
                proxy: { value: d },
                channel: p,
                tween: null,
                takeoverTarget: null,
                lastValue: d,
                tweenTarget: d,
              },
              T = {
                proxy: { value: f },
                channel: h,
                tween: null,
                takeoverTarget: null,
                lastValue: f,
                tweenTarget: f,
              },
              w = !1,
              _ = (k, U) => {
                let q = Ja(v.proxy.value, T.proxy.value, k, U);
                ti(c, v, k, q), ti(c, T, U, q);
              },
              I = Za(),
              x = s ? document.documentElement : t,
              G = null;
            I && (G = new Ga.TouchScrollGuard(x, y));
            let R = null,
              A = () => {
                R = null;
              },
              j = () => (R || (R = t.getBoundingClientRect()), R);
            if (!s) {
              let k = new ResizeObserver(A);
              k.observe(t),
                y.addEventListener("abort", () => k.disconnect()),
                window.addEventListener("scroll", A, {
                  passive: !0,
                  capture: !0,
                  signal: y,
                }),
                window.visualViewport &&
                  window.visualViewport.addEventListener("resize", A, {
                    signal: y,
                  });
            }
            let J;
            try {
              if (
                ((J = c.createObserver({
                  target: x,
                  type: I ? "pointer,touch" : "pointer",
                  tolerance: 0,
                  onMove: (k) => {
                    if (G?.isScrolling || !a.isPreviewEnabled()) return;
                    let U = k.x ?? 0,
                      q = k.y ?? 0,
                      $,
                      ue;
                    if (s)
                      ($ = qe(U / Math.max(1, ni))),
                        (ue = qe(q / Math.max(1, ri)));
                    else {
                      let Y = j();
                      ($ = qe((U - Y.left) / Math.max(1, Y.width))),
                        (ue = qe((q - Y.top) / Math.max(1, Y.height)));
                    }
                    w ? (ei(v, $), ei(T, ue)) : ((w = !0), _($, ue)),
                      a.publishChannel(
                        ne.MOUSE_MOVE_CHANNELS.POSITION,
                        { x: U, y: q, triggerEl: t, isViewport: s },
                        t
                      ),
                      C &&
                        (C.update(k.velocityX, k.velocityY),
                        S.update({
                          x: U,
                          y: q,
                          velocityFactor: C.lastNormVelocity,
                          dirX: C.dirX,
                          dirY: C.dirY,
                        }));
                  },
                })),
                !J)
              )
                return S?.destroy(), C?.destroy(), g.abort(), l(), Ae.noop;
            } catch {
              return S?.destroy(), C?.destroy(), g.abort(), l(), Ae.noop;
            }
            let V = () => {
              a.isPreviewEnabled() &&
                ((w = !1),
                _(d, f),
                C?.reset(),
                a.publishChannel(ne.MOUSE_MOVE_CHANNELS.LEAVE, void 0, t),
                S?.reset());
            };
            return (
              s
                ? (x.addEventListener("mouseleave", V, { signal: y }),
                  window.addEventListener("blur", V, { signal: y }))
                : t.addEventListener("mouseleave", V, { signal: y }),
              x.addEventListener("touchend", V, { signal: y, passive: !0 }),
              x.addEventListener("touchcancel", V, { signal: y, passive: !0 }),
              () => {
                J.kill(),
                  g.abort(),
                  Qt(v),
                  Qt(T),
                  S?.destroy(),
                  C?.destroy(),
                  l();
              }
            );
          },
        }),
        Ae.noop
      );
    });
  }
});
var si = m((Jt) => {
  "use strict";
  Object.defineProperty(Jt, "__esModule", { value: !0 });
  Object.defineProperty(Jt, "build", {
    enumerable: !0,
    get: function () {
      return nc;
    },
  });
  var _e = Me(),
    tc = ii();
  function nc(n) {
    rc(n),
      ic(n),
      (0, tc.buildMouseMove)(n),
      oc(n),
      sc(n),
      n.addTrigger("load", (e, t, r, o) => {
        let i = e[1],
          s = !1,
          a = () => {
            s || ((s = !0), o({ target: t }));
          };
        switch (i.pluginConfig?.triggerPoint) {
          case "immediate":
            return a(), _e.noop;
          case "fullyLoaded":
            return document.readyState === "complete"
              ? (a(), _e.noop)
              : r.addEventListener(window, "load", a);
          case "DOMContentLoaded":
          default:
            return document.readyState === "complete" ||
              document.readyState === "interactive"
              ? (a(), _e.noop)
              : r.addEventListener(document, "DOMContentLoaded", a);
        }
      }),
      n.addTrigger("focus", (e, t, r, o) => {
        let i = e[1];
        return r.addEventListener(
          t,
          i.pluginConfig?.useFocusWithin ? "focusin" : "focus",
          o,
          { delegate: !i.pluginConfig?.useFocusWithin }
        );
      }),
      n.addTrigger("blur", (e, t, r, o) => {
        let i = e[1];
        return r.addEventListener(
          t,
          i.pluginConfig?.useFocusWithin ? "focusout" : "blur",
          o,
          { delegate: !i.pluginConfig?.useFocusWithin }
        );
      }),
      n.addTrigger("scroll", (e, t, r, o) => (o({ target: t }), _e.noop)),
      n.addTrigger("custom", (e, t, r, o) => {
        let s = e[1].pluginConfig?.eventName;
        return s
          ? r.addEventListener(t, s, o, { delegate: !1, kind: "custom" })
          : _e.noop;
      }),
      n.addTrigger("change", (e, t, r, o) =>
        r.addEventListener(t, "change", o)
      );
  }
  function rc(n) {
    let e = new WeakMap();
    n.addTrigger("click", (t, r, o, i) => {
      let [, s] = t,
        a = o.addEventListener(
          r,
          "click",
          (c) => {
            let l = s.pluginConfig?.click,
              u = e.get(r) || new WeakMap();
            e.set(r, u);
            let f = (u.get(t) || 0) + 1;
            switch ((u.set(t, f), l)) {
              case "each": {
                i(c);
                break;
              }
              case "first": {
                f === 1 && i(c);
                break;
              }
              case "second": {
                f === 2 && i(c);
                break;
              }
              case "odd": {
                f % 2 === 1 && i(c);
                break;
              }
              case "even": {
                f % 2 === 0 && i(c);
                break;
              }
              case "custom": {
                let p = s.pluginConfig?.custom;
                p && f === p && i(c);
                break;
              }
              default:
                i(c);
            }
          },
          { delegate: !0 }
        );
      return () => {
        a(), e.delete(r);
      };
    });
  }
  function ic(n) {
    let e = new WeakMap();
    n.addTrigger("hover", (t, r, o, i) => {
      let [, s] = t,
        a = [],
        c = (l, u) => {
          if ((s.pluginConfig?.type ?? "mouseenter") !== u) return;
          let f = s.pluginConfig?.hover || "each",
            p = e.get(r) || new Map();
          e.set(r, p);
          let g = (p.get(u) || 0) + 1;
          switch ((p.set(u, g), f)) {
            case "each": {
              i(l);
              break;
            }
            case "first": {
              g === 1 && i(l);
              break;
            }
            case "second": {
              g === 2 && i(l);
              break;
            }
            case "odd": {
              g % 2 === 1 && i(l);
              break;
            }
            case "even": {
              g % 2 === 0 && i(l);
              break;
            }
            case "custom": {
              let y = s.pluginConfig?.custom;
              y && g === y && i(l);
              break;
            }
            default:
              i(l);
          }
        };
      return (
        a.push(
          o.addEventListener(r, "mouseenter", (l) => {
            c(l, "mouseenter");
          })
        ),
        a.push(
          o.addEventListener(r, "mouseover", (l) => {
            c(l, "mouseover");
          })
        ),
        a.push(
          o.addEventListener(r, "mouseleave", (l) => {
            c(l, "mouseleave");
          })
        ),
        () => {
          a.forEach((l) => l()), (a.length = 0), e.delete(r);
        }
      );
    });
  }
  function oi(n, e) {
    n.addTrigger(e, (t, r, o, i) => {
      let s = t[1].pluginConfig?.event,
        a = "IX3_COMPONENT_STATE_CHANGE";
      return o.addEventListener(r, a, (c) => {
        let l = c.detail;
        if (!l || typeof l != "object") return;
        let { component: u, state: d } = l;
        u !== e ||
          !d ||
          (s && d !== s) ||
          i({ type: "timeline-role", role: d });
      });
    });
  }
  function oc(n) {
    oi(n, "navbar");
  }
  function sc(n) {
    oi(n, "dropdown");
  }
});
var ve = m((en) => {
  "use strict";
  Object.defineProperty(en, "__esModule", { value: !0 });
  function ac(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  ac(en, {
    resolveToNumber: function () {
      return cc;
    },
    resolveToString: function () {
      return lc;
    },
  });
  function cc(n, e) {
    if (typeof n == "number") return n;
    if (typeof n == "string") {
      let t = n;
      if (t.startsWith("var(")) {
        let o = t.slice(4, -1).split(",")[0]?.trim() ?? "";
        if (!o || ((t = getComputedStyle(e).getPropertyValue(o).trim()), !t))
          return;
      }
      let r = parseFloat(t);
      return isNaN(r) ? void 0 : r;
    }
  }
  function lc(n, e) {
    if (typeof n == "string") {
      if (n.startsWith("var(")) {
        let t = n.slice(4, -1).split(",")[0]?.trim() ?? "";
        return (t && getComputedStyle(e).getPropertyValue(t).trim()) || void 0;
      }
      return n;
    }
  }
});
var ui = m((rn) => {
  "use strict";
  Object.defineProperty(rn, "__esModule", { value: !0 });
  function uc(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  uc(rn, {
    buildMouseFollowAction: function () {
      return mc;
    },
    forTestSuite: function () {
      return gc;
    },
  });
  var tn = te(),
    $e = Me(),
    dc = 0.5,
    He = 50;
  function fc(n) {
    let e = 2166136261;
    for (let t = 0; t < n.length; t++)
      (e ^= n.charCodeAt(t)), (e = Math.imul(e, 16777619));
    return e >>> 0;
  }
  function pc(n) {
    let e = n >>> 0;
    return () => {
      e = (e + 1831565813) | 0;
      let t = Math.imul(e ^ (e >>> 15), 1 | e);
      return (
        (t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)),
        ((t ^ (t >>> 14)) >>> 0) / 4294967296
      );
    };
  }
  function ai(n, e, t) {
    if (n <= 1) return [0];
    if (typeof e == "number") {
      let r = Math.max(0, Math.min(n - 1, Math.floor(e))),
        o = [r];
      for (let i = 1; o.length < n; i++)
        r + i < n && o.push(r + i), r - i >= 0 && o.push(r - i);
      return o;
    }
    switch (e) {
      case "start":
        return Array.from({ length: n }, (r, o) => o);
      case "center": {
        let r = [],
          o = Math.floor((n - 1) / 2);
        r.push(o);
        for (let i = 1; r.length < n; i++)
          o + i < n && r.push(o + i), o - i >= 0 && r.push(o - i);
        return r;
      }
      case "random": {
        let r = t != null && t !== "" ? pc(fc(t)) : Math.random,
          o = Array.from({ length: n }, (i, s) => s);
        for (let i = n - 1; i > 0; i--) {
          let s = Math.floor(r() * (i + 1));
          [o[i], o[s]] = [o[s], o[i]];
        }
        return o;
      }
      case "edges": {
        let r = [],
          o = 0,
          i = n - 1;
        for (; o <= i; ) r.push(o), o !== i && r.push(i), o++, i--;
        return r;
      }
      case "end":
      default:
        return Array.from({ length: n }, (r, o) => n - 1 - o);
    }
  }
  function nn(n) {
    if (n == null) return He;
    let e = typeof n == "number" ? n * 1e3 : parseFloat(n);
    return Number.isFinite(e) && e >= 0 ? e : He;
  }
  var Ie = (n) => {
      if (typeof n != "string") return 0.5;
      let e = /^(-?\d+(?:\.\d+)?)%$/.exec(n.trim());
      if (e) return Math.max(0, Math.min(1, parseFloat(e[1]) / 100));
      let t = n.trim().toLowerCase();
      return t === "left" || t === "top"
        ? 0
        : t === "right" || t === "bottom"
        ? 1
        : 0.5;
    },
    ci = (n, e) => {
      if (n?.amount != null) {
        let t = nn(n.amount),
          r = e > 1 ? t / (e - 1) : He;
        return Math.max(1, r);
      }
      return n?.each != null ? Math.max(1, nn(n.each)) : 1;
    },
    li = (n) => {
      if (!n) return { x: 0.5, y: 0.5 };
      if (typeof n == "string") {
        let [e, t] = n.trim().split(/\s+/);
        return { x: Ie(e ?? "50%"), y: Ie(t ?? "50%") };
      }
      return { x: Ie(n.x), y: Ie(n.y) };
    },
    gc = {
      DEFAULT_STAGGER_MS: He,
      computeMouseFollowSmoothingMs: ci,
      getChainOrder: ai,
      parseAnchor: li,
      parseAnchorAxis: Ie,
      staggerEachToMs: nn,
    };
  function hc(n, e, t, r) {
    if (!t.length) return;
    let o = r?.animation;
    if (!o?.hasGsap()) return;
    let i =
        typeof window < "u" &&
        typeof window.matchMedia == "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      s = e,
      a = s?.leaveBehavior ?? "return",
      c = s?.onEnter ?? "animate",
      l = r?.timelineRole,
      u = l === "mouseX" ? "x" : l === "mouseY" ? "y" : s?.axis ?? "x",
      d = u,
      f = s?.followMode;
    if (
      f != null &&
      f !== "full" &&
      f !== (0, tn.getSingleAxisMouseFollowMode)(u)
    )
      return;
    let p = li(s?.anchor),
      h = u === "x" ? p.x : p.y,
      g = t.map((b) => o.getProperty(b, d)),
      y = t.map((b) => o.quickSetter(b, d, "px"));
    if (y.some((b) => b == null)) return;
    let E = y,
      M = (0, $e.initScrollCache)(),
      S = t.map((b) => {
        let O = b.getBoundingClientRect();
        return u === "x"
          ? O.left + O.width * h
          : O.top + O.height * h + (0, $e.getScrollY)();
      }),
      C = n.timing?.stagger,
      v = t.length,
      T = ci(C, v),
      w = C?.from,
      I = ai(
        v,
        typeof w == "number" ||
          w === "start" ||
          w === "center" ||
          w === "edges" ||
          w === "end" ||
          w === "random"
          ? w
          : "end",
        s?.groupId ?? s?.syncedActionId
      );
    if (I.length === 0) return;
    let x = new Float64Array(v),
      G = I[0],
      R = { value: S[G] ?? 0 },
      A = null,
      j = !1,
      J = 0,
      V = null,
      k = !1,
      U = null,
      q = performance.now(),
      $ = 0,
      ue = () => {
        let b = performance.now(),
          O = Math.min(b - q, 100);
        q = b;
        let D = 1 - Math.exp(-O / T),
          N = !1;
        for (let F = 0; F < I.length; F++) {
          let P = I[F],
            de;
          if (F === 0) de = R.value;
          else {
            let er = I[F - 1];
            de = S[er] + x[er];
          }
          let Jn = de - S[P],
            nt = Jn - x[P];
          Math.abs(nt) > dc
            ? ((x[P] = x[P] + nt * D), E[P](x[P]), (N = !0))
            : nt !== 0 && ((x[P] = Jn), E[P](x[P]));
        }
        A?.isActive() && (N = !0), N || Y();
      },
      Y = () => {
        k && (U?.(), (U = null), (k = !1));
      },
      Qn = (b) => {
        A?.kill(), (A = null), ($ = 0), (R.value = b);
        for (let O = 0; O < I.length; O++) {
          let D = I[O],
            N = b - S[D];
          (x[D] = N), E[D](N);
        }
        Y();
      },
      lo = () => {
        A?.kill(), (A = null), ($ = 0), (R.value = S[G] ?? 0);
        for (let b = 0; b < I.length; b++) {
          let O = I[b];
          (x[O] = 0), E[O](0);
        }
        Y();
      },
      ee = () => {
        k || ((q = performance.now()), (U = o.addTicker(ue)), (k = !0));
      },
      uo = (b, O) => {
        (V = b),
          (J = O
            ? u === "x"
              ? window.innerWidth
              : window.innerHeight
            : u === "x"
            ? b.offsetWidth
            : b.offsetHeight);
      },
      fo = (b) => {
        V || uo(b.triggerEl, b.isViewport);
        let O = u === "x" ? b.x : b.y + (0, $e.getScrollY)();
        if (i) {
          (j = !0), Qn(O);
          return;
        }
        if (j)
          if (A) {
            let D = Math.max($ - performance.now(), 50);
            A.kill();
            let N = o.to(R, {
              value: O,
              duration: D / 1e3,
              ease: "power2.out",
              onUpdate: ee,
              onComplete: () => {
                A === N && ((A = null), ($ = 0));
              },
            });
            if (!N) {
              (R.value = O), ee();
              return;
            }
            A = N;
          } else R.value = O;
        else {
          if (((j = !0), c === "snap")) {
            Qn(O);
            return;
          }
          let D = Math.abs(O - R.value),
            F = 0.1 + Math.min(D / (J || 1), 1) * 0.5;
          ($ = performance.now() + F * 1e3), A?.kill();
          let P = o.to(R, {
            value: O,
            duration: F,
            ease: "power2.out",
            onUpdate: ee,
            onComplete: () => {
              A === P && ((A = null), ($ = 0));
            },
          });
          if (!P) {
            (R.value = O), ee();
            return;
          }
          A = P;
        }
        ee();
      },
      po = () => {
        if (((j = !1), a === "stay")) {
          ee();
          return;
        }
        if (i) {
          lo();
          return;
        }
        let b = S[G] ?? 0,
          O = Math.abs(R.value - b),
          N = 0.1 + Math.min(O / (J || 1), 1) * 0.5;
        A?.kill();
        let F = o.to(R, {
          value: b,
          duration: N,
          ease: "power2.out",
          onUpdate: ee,
          onComplete: () => {
            A === F && (A = null);
          },
        });
        if (!F) {
          (R.value = b), ee();
          return;
        }
        A = F;
      },
      go = r?.subscribeChannel?.(tn.MOUSE_MOVE_CHANNELS.POSITION, fo),
      ho = r?.subscribeChannel?.(tn.MOUSE_MOVE_CHANNELS.LEAVE, po),
      Kn = new AbortController(),
      { signal: mo } = Kn,
      tt = 0,
      yo = () => {
        clearTimeout(tt),
          (tt = window.setTimeout(() => {
            V && (J = u === "x" ? V.offsetWidth : V.offsetHeight);
            for (let b = 0; b < t.length; b++) {
              let O = t[b],
                D = o.getProperty(O, d),
                N = typeof D == "number" ? D : parseFloat(String(D)),
                F = Number.isFinite(N) ? N : 0,
                P = O.getBoundingClientRect(),
                de = u === "x" ? P.left + P.width * h : P.top + P.height * h;
              (S[b] = u === "x" ? de - F : de - F + (0, $e.getScrollY)()),
                (x[b] = F);
            }
            if (!j) {
              let b = S[G];
              b !== void 0 &&
                (A?.isActive() && (A.kill(), (A = null)), (R.value = b));
            }
          }, 250));
      };
    return (
      window.addEventListener("resize", yo, { signal: mo }),
      () => {
        A?.kill(), Y(), clearTimeout(tt), Kn.abort(), go?.(), ho?.(), M();
        for (let b = 0; b < t.length; b++) o.set(t[b], { [d]: g[b] });
      }
    );
  }
  function mc(n) {
    n.addAction("mouse-follow", {
      requiresTriggerElementContext: !0,
      createCustomTween: (e, t, r, o, i, s, a) => hc(t, r, i, a),
    });
  }
});
var fi = m((on) => {
  "use strict";
  Object.defineProperty(on, "__esModule", { value: !0 });
  Object.defineProperty(on, "build", {
    enumerable: !0,
    get: function () {
      return vc;
    },
  });
  var Re = ve(),
    yc = ui();
  function di(n, e) {
    return e != null && typeof n == "string" && n.startsWith("var(")
      ? (0, Re.resolveToString)(n, e) ?? n
      : n;
  }
  function vc(n) {
    (0, yc.buildMouseFollowAction)(n),
      n
        .addAction("class", {
          createCustomTween: (e, t, r, o, i, s) => {
            let a = r.class,
              c = a?.selectors || [],
              l = a?.operation,
              u = c
                ? i.map((f) => ({ element: f, classList: [...f.classList] }))
                : [],
              d = () => {
                if (!(!l || !c))
                  for (let f of i)
                    l === "addClass"
                      ? c.forEach((p) => f.classList.add(p))
                      : l === "removeClass"
                      ? c.forEach((p) => f.classList.remove(p))
                      : l === "toggleClass" &&
                        c.forEach((p) => f.classList.toggle(p));
              };
            return (
              e.to(
                {},
                { duration: 0.001, onComplete: d, onReverseComplete: d },
                !s || s === 0 ? 0.001 : s
              ),
              () => {
                if (c) {
                  for (let f of u)
                    if (
                      f.element &&
                      (f.element instanceof HTMLElement &&
                        (f.element.className = ""),
                      f.element.classList)
                    )
                      for (let p of f.classList) f.element.classList.add(p);
                }
              }
            );
          },
        })
        .addAction("style", {
          createTweenConfig: (e, t) => {
            let r = { to: {}, from: {} },
              o = t?.[0];
            for (let i in e) {
              let s = e[i],
                a = di(Array.isArray(s) ? s[1] : s, o),
                c = Array.isArray(s) ? di(s[0], o) : void 0;
              a != null && (r.to[i] = a), c != null && (r.from[i] = c);
            }
            return r;
          },
        })
        .addAction("transform", {
          createTweenConfig: (e, t) => {
            let r = { to: {}, from: {} },
              o = t?.[0];
            for (let i in e) {
              let s = e[i],
                a = Array.isArray(s) ? s[1] : s,
                c = Array.isArray(s) ? s[0] : void 0;
              switch (i) {
                case "autoAlpha":
                case "opacity": {
                  if (a != null && typeof a == "string") {
                    let l = o ? (0, Re.resolveToNumber)(a, o) : parseFloat(a);
                    a = l !== void 0 ? l / 100 : a;
                  }
                  if (c != null && typeof c == "string") {
                    let l = o ? (0, Re.resolveToNumber)(c, o) : parseFloat(c);
                    c = l !== void 0 ? l / 100 : c;
                  }
                  break;
                }
                case "transformOrigin": {
                  typeof s == "string"
                    ? ((a = a || s), (c = a))
                    : typeof c == "string"
                    ? (a = c)
                    : typeof a == "string" && (c = a);
                  break;
                }
                case "xPercent":
                case "yPercent": {
                  if (a != null && typeof a == "string") {
                    let l = o ? (0, Re.resolveToNumber)(a, o) : parseFloat(a);
                    a = l !== void 0 ? l : a;
                  }
                  if (c != null && typeof c == "string") {
                    let l = o ? (0, Re.resolveToNumber)(c, o) : parseFloat(c);
                    c = l !== void 0 ? l : c;
                  }
                  break;
                }
              }
              a != null && (r.to[i] = a), c != null && (r.from[i] = c);
            }
            return r;
          },
        });
  }
});
var hi = m((sn) => {
  "use strict";
  Object.defineProperty(sn, "__esModule", { value: !0 });
  Object.defineProperty(sn, "buildLottieAction", {
    enumerable: !0,
    get: function () {
      return Tc;
    },
  });
  var bc = ve();
  function Tc(n) {
    n.addAction("lottie", {
      createCustomTween: (e, t, r, o, i, s) => {
        let a = r.lottie;
        if (!a || !i.length || !window.Webflow) return;
        let c = window.Webflow.require?.("lottie");
        if (!c) return;
        let l = [],
          u = !1;
        for (let d of i) {
          let f = gi(a.from, d, pi.FROM),
            p = gi(a.to, d, pi.TO),
            h = c.createInstance(d);
          if (!h) continue;
          l.push(h);
          let g = () => {
            if (u) return;
            let y = h.frames,
              E = Math.round(f * y),
              M = Math.round(p * y);
            h.gsapFrame === null && (h.gsapFrame = E);
            let S = o;
            S.ease || (S = { ...S, ease: "none" }),
              e.fromTo(h, { gsapFrame: E }, { gsapFrame: M, ...S }, s || 0);
          };
          h.isLoaded ? g() : h.onDataReady(g);
        }
        return () => {
          u = !0;
          for (let d of l) d.goToFrameAndStop(0), (d.gsapFrame = null);
        };
      },
    });
  }
  var pi = { DURATION: 1, FROM: 0, TO: 1 };
  function gi(n, e, t) {
    if (typeof n == "number") return n;
    let r = (0, bc.resolveToNumber)(n, e);
    return r !== void 0 ? r / 100 : t;
  }
});
var cn = m((an) => {
  "use strict";
  Object.defineProperty(an, "__esModule", { value: !0 });
  Object.defineProperty(an, "RIVE_CONSTANTS", {
    enumerable: !0,
    get: function () {
      return wc;
    },
  });
  var wc = { MINIMUM_TIME: 0.001, MAX_BYTE_VALUE: 255 };
});
var dn = m((un) => {
  "use strict";
  Object.defineProperty(un, "__esModule", { value: !0 });
  function Cc(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Cc(un, {
    clearSurfaceCache: function () {
      return Sc;
    },
    surfaceCache: function () {
      return ln;
    },
  });
  var ln = new WeakMap();
  function Sc(n, e) {
    if (!e) return;
    let t = `${e.name}:${e.instanceName ?? ""}`,
      r = ln.get(n);
    r && (r.delete(t), r.size === 0 && ln.delete(n));
  }
});
var xe = m((fn) => {
  "use strict";
  Object.defineProperty(fn, "__esModule", { value: !0 });
  function Ec(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Ec(fn, {
    parseVmKey: function () {
      return Oc;
    },
    vmKey: function () {
      return Mc;
    },
  });
  function Mc(n, e, t) {
    return `vm:${n}:${e}:${t}`;
  }
  var Ac = new Set([
    "string",
    "number",
    "boolean",
    "color",
    "enum",
    "trigger",
    "artboard",
  ]);
  function Oc(n) {
    if (!n.startsWith("vm:")) return null;
    let e = n.lastIndexOf(":"),
      t = n.slice(e + 1);
    if (!Ac.has(t)) return null;
    let r = n.slice(3, e),
      o = r.indexOf(":");
    return o === -1
      ? null
      : { vmName: r.slice(0, o), propName: r.slice(o + 1), propType: t };
  }
});
var Ge = m((pn) => {
  "use strict";
  Object.defineProperty(pn, "__esModule", { value: !0 });
  function _c(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  _c(pn, {
    getVmiProperty: function () {
      return mi;
    },
    storeOriginalValues: function () {
      return Rc;
    },
  });
  var Ic = xe();
  function Rc(n, e) {
    let t = { viewModelProperties: {} };
    for (let r of n) xc(e, r.propertyName, r.propertyType, t);
    return t;
  }
  function xc(n, e, t, r) {
    let o = (0, Ic.vmKey)(n.name, e, t);
    if (!(o in r.viewModelProperties)) {
      if (t === "artboard") {
        let s = n.riveInstance.viewModelInstance?.artboard?.(e)?.name;
        s != null && (r.viewModelProperties[o] = s);
        return;
      }
      let i = n.riveInstance.viewModelInstance
        ? Pc(n.riveInstance.viewModelInstance, t, e)
        : null;
      i != null && (r.viewModelProperties[o] = i);
    }
  }
  function mi(n, e, t) {
    switch (e) {
      case "number":
        return n.number(t);
      case "boolean":
        return n.boolean(t);
      case "string":
        return n.string(t);
      case "color":
        return n.color(t);
      case "enum":
        return n.enum(t);
      default:
        return null;
    }
  }
  function Pc(n, e, t) {
    let r = mi(n, e, t);
    return r ? r.value : void 0;
  }
});
var hn = m((gn) => {
  "use strict";
  Object.defineProperty(gn, "__esModule", { value: !0 });
  Object.defineProperty(gn, "parseColorToAARRGGBB", {
    enumerable: !0,
    get: function () {
      return Nc;
    },
  });
  var kc = cn();
  function Nc(n) {
    let e = n.trim();
    if (!e) return null;
    try {
      let { red: t, green: r, blue: o, alpha: i } = Lc(e);
      return t === void 0 || r === void 0 || o === void 0
        ? null
        : ((Math.round(i * kc.RIVE_CONSTANTS.MAX_BYTE_VALUE) << 24) |
            (t << 16) |
            (r << 8) |
            o) >>>
            0;
    } catch {
      return null;
    }
  }
  var ae = null;
  function Fc(n) {
    if (!ae) {
      let e = document.createElement("canvas");
      if (((e.width = 1), (e.height = 1), (ae = e.getContext("2d")), !ae))
        return null;
    }
    return (
      (ae.fillStyle = "#000000"),
      (ae.fillStyle = n),
      ae.fillStyle === "#000000" && n.toLowerCase() !== "black"
        ? null
        : ae.fillStyle
    );
  }
  function yi(n, e, t) {
    let r = (1 - Math.abs(2 * t - 1)) * e,
      o = r * (1 - Math.abs(((n / 60) % 2) - 1)),
      i = t - r / 2,
      s,
      a,
      c;
    return (
      n >= 0 && n < 60
        ? ((s = r), (a = o), (c = 0))
        : n >= 60 && n < 120
        ? ((s = o), (a = r), (c = 0))
        : n >= 120 && n < 180
        ? ((s = 0), (a = r), (c = o))
        : n >= 180 && n < 240
        ? ((s = 0), (a = o), (c = r))
        : n >= 240 && n < 300
        ? ((s = o), (a = 0), (c = r))
        : ((s = r), (a = 0), (c = o)),
      {
        red: Math.round((s + i) * 255),
        green: Math.round((a + i) * 255),
        blue: Math.round((c + i) * 255),
      }
    );
  }
  function Lc(n) {
    let e,
      t,
      r,
      o = 1,
      i = n.replace(/\s/g, "").toLowerCase(),
      s = i;
    if (!s.startsWith("#") && !s.startsWith("rgb") && !s.startsWith("hsl")) {
      let a = Fc(i);
      a && (s = a);
    }
    if (s.startsWith("#")) {
      let a = s.substring(1);
      a.length === 3 || a.length === 4
        ? ((e = parseInt(a.charAt(0) + a.charAt(0), 16)),
          (t = parseInt(a.charAt(1) + a.charAt(1), 16)),
          (r = parseInt(a.charAt(2) + a.charAt(2), 16)),
          a.length === 4 && (o = parseInt(a.charAt(3) + a.charAt(3), 16) / 255))
        : (a.length === 6 || a.length === 8) &&
          ((e = parseInt(a.substring(0, 2), 16)),
          (t = parseInt(a.substring(2, 4), 16)),
          (r = parseInt(a.substring(4, 6), 16)),
          a.length === 8 && (o = parseInt(a.substring(6, 8), 16) / 255));
    } else if (s.startsWith("rgba")) {
      let a = s.match(/rgba\(([^)]+)\)/)?.[1]?.split(",");
      (e = parseInt(a?.[0] ?? "", 10)),
        (t = parseInt(a?.[1] ?? "", 10)),
        (r = parseInt(a?.[2] ?? "", 10)),
        (o = parseFloat(a?.[3] ?? ""));
    } else if (s.startsWith("rgb")) {
      let a = s.match(/rgb\(([^)]+)\)/)?.[1]?.split(",");
      (e = parseInt(a?.[0] ?? "", 10)),
        (t = parseInt(a?.[1] ?? "", 10)),
        (r = parseInt(a?.[2] ?? "", 10));
    } else if (s.startsWith("hsla")) {
      let a = s.match(/hsla\(([^)]+)\)/)?.[1]?.split(","),
        c = parseFloat(a?.[0] ?? ""),
        l = parseFloat(a?.[1]?.replace("%", "") ?? "") / 100,
        u = parseFloat(a?.[2]?.replace("%", "") ?? "") / 100;
      (o = parseFloat(a?.[3] ?? "")),
        ({ red: e, green: t, blue: r } = yi(c, l, u));
    } else if (s.startsWith("hsl")) {
      let a = s.match(/hsl\(([^)]+)\)/)?.[1]?.split(","),
        c = parseFloat(a?.[0] ?? ""),
        l = parseFloat(a?.[1]?.replace("%", "") ?? "") / 100,
        u = parseFloat(a?.[2]?.replace("%", "") ?? "") / 100;
      ({ red: e, green: t, blue: r } = yi(c, l, u));
    }
    if (
      Number.isNaN(e) ||
      Number.isNaN(t) ||
      Number.isNaN(r) ||
      Number.isNaN(o)
    )
      throw new Error(`Invalid color value: '${n}'`);
    return { red: e, green: t, blue: r, alpha: o };
  }
});
var yn = m((mn) => {
  "use strict";
  Object.defineProperty(mn, "__esModule", { value: !0 });
  Object.defineProperty(mn, "setVmiValue", {
    enumerable: !0,
    get: function () {
      return Vc;
    },
  });
  var Dc = xe(),
    Bc = Ge(),
    jc = hn();
  function Vc(n, e, t, r, o, i) {
    let s = n.riveInstance.viewModelInstance;
    if (e === "trigger") {
      if (i) return;
      s?.trigger?.(t)?.fire?.();
      return;
    }
    if (!s) return;
    let a = (0, Bc.getVmiProperty)(s, e, t);
    if (!a) return;
    let c = o?.viewModelProperties[(0, Dc.vmKey)(n.name, t, e)],
      l = i ? c ?? r : r,
      u = `${e}:${t}`;
    switch (e) {
      case "number":
        typeof l == "number" && ((a.value = l), (n.currentValues[u] = l));
        return;
      case "boolean":
        typeof l == "boolean" && ((a.value = l), (n.currentValues[u] = l));
        return;
      case "string":
        typeof l == "string" && ((a.value = l), (n.currentValues[u] = l));
        return;
      case "enum":
        typeof l == "string" && ((a.value = l), (n.currentValues[u] = l));
        return;
      case "color": {
        let d =
          typeof l == "number"
            ? l
            : typeof l == "string"
            ? (0, jc.parseColorToAARRGGBB)(l)
            : null;
        d != null && ((a.value = d), (n.currentValues[u] = d));
        return;
      }
      default:
        return;
    }
  }
});
var bi = m((vn) => {
  "use strict";
  Object.defineProperty(vn, "__esModule", { value: !0 });
  function Uc(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Uc(vn, {
    createCleanupFunction: function () {
      return Gc;
    },
    restoreViewModelProperties: function () {
      return vi;
    },
  });
  var qc = xe(),
    $c = yn(),
    Hc = dn();
  function vi(n, e, t) {
    let r = n.viewModelInstance ?? null;
    if (r)
      for (let [o, i] of Object.entries(t.viewModelProperties)) {
        let s = (0, qc.parseVmKey)(o);
        if (!s || s.vmName !== e) continue;
        let a = { name: e, riveInstance: n, currentValues: {} };
        if (s.propType === "artboard") {
          if (typeof i != "string") continue;
          let c = r.artboard?.(s.propName),
            l = n.getArtboard?.(i);
          c && l && (c.value = l);
          continue;
        }
        (0, $c.setVmiValue)(a, s.propType, s.propName, i);
      }
  }
  function Gc(n, e, t) {
    return () => {
      !e || !n || (vi(n, e.name, t), (0, Hc.clearSurfaceCache)(n, e));
    };
  }
});
var Ci = m((bn) => {
  "use strict";
  Object.defineProperty(bn, "__esModule", { value: !0 });
  function zc(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  zc(bn, {
    interpolateAARRGGBB: function () {
      return wi;
    },
    setupAnimateTimeline: function () {
      return Xc;
    },
  });
  var Wc = Ge(),
    Yc = hn(),
    Ti = ve();
  function wi(n, e, t) {
    let r = (n >>> 24) & 255,
      o = (n >>> 16) & 255,
      i = (n >>> 8) & 255,
      s = n & 255,
      a = (e >>> 24) & 255,
      c = (e >>> 16) & 255,
      l = (e >>> 8) & 255,
      u = e & 255,
      d = Math.round(r + (a - r) * t),
      f = Math.round(o + (c - o) * t),
      p = Math.round(i + (l - i) * t),
      h = Math.round(s + (u - s) * t);
    return ((d << 24) | (f << 16) | (p << 8) | h) >>> 0;
  }
  function Xc(n, e, t, r, o, i) {
    if (t.length === 0) return;
    let s = e.riveInstance.viewModelInstance;
    if (s)
      for (let a of t) {
        if (
          a.value === null ||
          a.value === void 0 ||
          !(0, Wc.getVmiProperty)(s, a.propertyType, a.propertyName)
        )
          continue;
        let l,
          u = a.value;
        if (typeof u == "string" && u.startsWith("var(")) {
          if (
            (a.propertyType === "number"
              ? (l = (0, Ti.resolveToNumber)(u, i))
              : a.propertyType === "color" &&
                (l = (0, Ti.resolveToString)(u, i)),
            l === void 0)
          )
            continue;
        } else l = u;
        a.propertyType === "number"
          ? Zc(e, n, a.propertyName, l, r, o)
          : a.propertyType === "color" && Qc(e, n, a.propertyName, l, r, o);
      }
  }
  function Zc(n, e, t, r, o, i) {
    let s = n.riveInstance.viewModelInstance;
    if (!s) return;
    let a = s.number(t);
    if (!a) return;
    let c = typeof r == "number" ? r : parseFloat(String(r));
    if (isNaN(c)) return;
    let l = { v: a.value };
    e.to(
      l,
      {
        ...o,
        v: c,
        onStart() {
          let u = n.currentValues[`number:${t}`];
          (l.v = typeof u == "number" ? u : a.value), this.invalidate();
        },
        onUpdate: () => {
          a.value = l.v;
        },
      },
      i ?? 0
    );
  }
  function Qc(n, e, t, r, o, i) {
    let s = n.riveInstance.viewModelInstance;
    if (!s) return;
    let a = s.color(t);
    if (!a) return;
    let c = typeof r == "number" ? r : (0, Yc.parseColorToAARRGGBB)(String(r));
    if (c == null) return;
    let l = { fromPacked: a.value },
      u = { t: 0 };
    e.fromTo(
      u,
      { t: 0 },
      {
        ...o,
        t: 1,
        onStart() {
          let d = n.currentValues[`color:${t}`];
          (l.fromPacked = typeof d == "number" ? d : a.value),
            this.invalidate();
        },
        onUpdate: () => {
          a.value = wi(l.fromPacked, c, u.t);
        },
      },
      i ?? 0
    );
  }
});
var Oi = m((Cn) => {
  "use strict";
  Object.defineProperty(Cn, "__esModule", { value: !0 });
  function Kc(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Kc(Cn, {
    resolveSurfaceArea: function () {
      return wn;
    },
    setupAnimateAnimation: function () {
      return il;
    },
    setupAnimation: function () {
      return rl;
    },
    setupTimeline: function () {
      return Ai;
    },
  });
  var Si = cn(),
    Tn = dn(),
    Ei = Ge(),
    Mi = bi(),
    Jc = yn(),
    el = Ci(),
    tl = xe(),
    ze = ve();
  function wn(n, e) {
    if (!e) return null;
    let t = `${e.name}:${e.instanceName ?? ""}`,
      r = Tn.surfaceCache.get(n)?.get(t);
    if (r) return r;
    let i =
      (n.viewModelByName?.(e.name) ?? void 0)?.instanceByName?.(
        e.instanceName ?? ""
      ) ?? null;
    n.bindViewModelInstance?.(i);
    let s = { name: e.name, riveInstance: n, currentValues: {} },
      a = Tn.surfaceCache.get(n);
    return a || ((a = new Map()), Tn.surfaceCache.set(n, a)), a.set(t, s), s;
  }
  function Ai(n, e, t, r, o, i) {
    if (t.length === 0) return;
    for (let c of t) {
      if (
        c.propertyType === "trigger" ||
        c.propertyType === "artboard" ||
        c.value === null ||
        c.value === void 0
      )
        continue;
      let l = c.value,
        u;
      typeof l == "string" && l.startsWith("var(")
        ? (u =
            c.propertyType === "number"
              ? (0, ze.resolveToNumber)(l, i)
              : c.propertyType === "color"
              ? (0, ze.resolveToString)(l, i)
              : void 0)
        : (u = l),
        u !== void 0 &&
          (e.currentValues[`${c.propertyType}:${c.propertyName}`] = u);
    }
    let s = (c) => {
        for (let l of t) {
          if (
            (l.propertyType !== "trigger" && l.value === null) ||
            l.value === void 0
          )
            continue;
          let u,
            d = l.value;
          if (typeof d == "string" && d.startsWith("var(")) {
            if (
              (l.propertyType === "number"
                ? (u = (0, ze.resolveToNumber)(d, i))
                : l.propertyType === "color" &&
                  (u = (0, ze.resolveToString)(d, i)),
              u === void 0)
            )
              continue;
          } else u = d;
          nl(e, l.propertyName, l.propertyType, u, r, c);
        }
      },
      a = { int: 0 };
    n.to(
      a,
      {
        int: 1,
        duration: Si.RIVE_CONSTANTS.MINIMUM_TIME,
        onStart: () => {
          s(!1);
        },
        onReverseComplete: () => {
          s(!0);
        },
      },
      o ?? Si.RIVE_CONSTANTS.MINIMUM_TIME
    );
  }
  function nl(n, e, t, r, o, i) {
    if (t === "artboard") {
      if (typeof r != "string") return;
      let s = n.riveInstance.viewModelInstance?.artboard?.(e);
      if (!s) return;
      if (i) {
        let c = (0, tl.vmKey)(n.name, e, t),
          l = o?.viewModelProperties[c];
        if (typeof l == "string") {
          let u = n.riveInstance.getArtboard?.(l);
          u && (s.value = u);
        }
        return;
      }
      let a = n.riveInstance.getArtboard?.(r);
      if (!a) return;
      s.value = a;
      return;
    }
    (0, Jc.setVmiValue)(n, t, e, r, o, i);
  }
  function rl(n, e, t, r, o) {
    let i = e.animationSource,
      s = wn(n, i);
    if (!s) return;
    let a = e.addedProperties ?? {},
      c = Object.values(a),
      l = (0, Ei.storeOriginalValues)(c, s);
    return Ai(t, s, c, l, r, o), (0, Mi.createCleanupFunction)(n, i, l);
  }
  function il(n, e, t, r, o, i) {
    let s = e.animationSource,
      a = wn(n, s);
    if (!a) return;
    let c = e.addedProperties ?? {},
      l = Object.values(c),
      u = (0, Ei.storeOriginalValues)(l, a);
    return (
      (0, el.setupAnimateTimeline)(t, a, l, r, o, i),
      (0, Mi.createCleanupFunction)(n, s, u)
    );
  }
});
var ki = m((Sn) => {
  "use strict";
  Object.defineProperty(Sn, "__esModule", { value: !0 });
  function ol(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  ol(Sn, {
    buildAnimateRiveAction: function () {
      return cl;
    },
    buildRiveAction: function () {
      return al;
    },
  });
  var Ri = Oi();
  function _i(n) {
    return (
      typeof n == "object" &&
      n !== null &&
      "loaded" in n &&
      typeof n.loaded == "boolean"
    );
  }
  function Ii(n) {
    !n.isPlaying && n.play && n.play();
  }
  function sl(n, e, t) {
    let o = e.getInstance(n)?.rive,
      i = _i(o) ? o : null;
    if (i?.loaded) return Ii(i), t(i, n);
    let s,
      a = !1,
      c = () => {
        if (a || !n.isConnected) return;
        let u = e.getInstance(n)?.rive,
          d = _i(u) ? u : null;
        d?.loaded && (Ii(d), (s = t(d, n))),
          n.removeEventListener("w-rive-load", c);
      };
    return (
      n.addEventListener("w-rive-load", c),
      () => {
        (a = !0), n.removeEventListener("w-rive-load", c), s?.();
      }
    );
  }
  function xi(n, e, t) {
    let r = [];
    for (let o of n) {
      let i = sl(o, e, t);
      i && r.push(i);
    }
    if (r.length !== 0)
      return () => {
        for (let o of r) o();
      };
  }
  function Pi() {
    return window.Webflow ? window.Webflow.require?.("rive") ?? null : null;
  }
  function al(n) {
    n.addAction("rive", {
      createCustomTween: (e, t, r, o, i, s) => {
        let a = r.rive;
        if (!a || !i.length) return;
        let c = Pi();
        if (c) return xi(i, c, (l, u) => (0, Ri.setupAnimation)(l, a, e, s, u));
      },
    });
  }
  function cl(n) {
    n.addAction("animate-rive", {
      createCustomTween: (e, t, r, o, i, s) => {
        let a = r.rive;
        if (!a || !i.length) return;
        let c = Pi();
        if (c)
          return xi(i, c, (l, u) =>
            (0, Ri.setupAnimateAnimation)(l, a, e, o, s, u)
          );
      },
    });
  }
});
var ce = m((En) => {
  "use strict";
  Object.defineProperty(En, "__esModule", { value: !0 });
  function ll(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  ll(En, {
    checkTt: function () {
      return gl;
    },
    hasBBoxUpdate: function () {
      return fl;
    },
    hasIntensity: function () {
      return ul;
    },
    hasMatrixUpdate: function () {
      return pl;
    },
    hasRenderOrder: function () {
      return dl;
    },
  });
  var We = X(),
    ul = (n) => "intensity" in n,
    dl = (n) => "renderOrder" in n,
    fl = (n) => "singleBBoxNeedsUpdate" in n && "recursiveBBoxNeedsUpdate" in n,
    pl = (n) => "updateMatrix" in n && "updateMatrixWorld" in n,
    gl = (n, e) =>
      e === "from"
        ? n === We.TweenType.From || n === We.TweenType.FromTo
        : n === We.TweenType.To || n === We.TweenType.FromTo;
});
var An = m((Mn) => {
  "use strict";
  Object.defineProperty(Mn, "__esModule", { value: !0 });
  Object.defineProperty(Mn, "colorDataToCss", {
    enumerable: !0,
    get: function () {
      return hl;
    },
  });
  var hl = ({ r: n, g: e, b: t, a: r }) => {
    let o = (l) => Math.round(Math.min(1, Math.max(0, l)) * 255),
      i = o(n),
      s = o(e),
      a = o(t);
    if (r === void 0 || r >= 1) return `rgba(${i}, ${s}, ${a}, 1)`;
    let c = Math.min(1, Math.max(0, r));
    return `rgba(${i}, ${s}, ${a}, ${c})`;
  };
});
var Ni = m((On) => {
  "use strict";
  Object.defineProperty(On, "__esModule", { value: !0 });
  Object.defineProperty(On, "storeOriginalState", {
    enumerable: !0,
    get: function () {
      return vl;
    },
  });
  var ml = ce(),
    yl = An(),
    vl = (n, e, t) => {
      let r = n.material,
        o = Array.isArray(r) ? r : r ? [r] : [],
        i = e.spline._scene.entityByUuid[t]?.color,
        s = i ? (0, yl.colorDataToCss)(i) : void 0,
        a = n.rotation;
      return {
        position: { ...n.position },
        rotation: { x: a._x ?? 0, y: a._y ?? 0, z: a._z ?? 0 },
        scale: { ...n.scale },
        ...(s ? { color: s } : {}),
        intensity: n.intensity,
        renderOrder: (0, ml.hasRenderOrder)(n) ? n.renderOrder : void 0,
        materials: o?.map((c) => ({
          transparent: c.transparent,
          depthWrite: c.depthWrite,
          alpha: c.alpha,
          layers: (c.layers ?? []).map((l) => ({
            visible: l.visible,
            alpha: l.alpha,
            alphaOverride: l.alphaOverride,
            ior: l.ior,
            thickness: l.thickness,
          })),
        })),
      };
    };
});
var Pe = m((_n) => {
  "use strict";
  Object.defineProperty(_n, "__esModule", { value: !0 });
  Object.defineProperty(_n, "SPLINE_CONSTANTS", {
    enumerable: !0,
    get: function () {
      return bl;
    },
  });
  var bl = {
    OPACITY_RENDER_ORDER: 999,
    TRANSITION_END_OFFSET: 0.001,
    DEFAULT_TRANSITION_DURATION: 0.5,
    OPACITY_TRANSPARENCY_THRESHOLD: 0.01,
    DEFAULT_TRANSMISSION_IOR: 1.3,
    DEFAULT_TRANSMISSION_THICKNESS: 10,
    MIN_ZOOM_VALUE: 1e-4,
  };
});
var Ye = m((In) => {
  "use strict";
  Object.defineProperty(In, "__esModule", { value: !0 });
  function Tl(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Tl(In, {
    getAppZoom: function () {
      return Cl;
    },
    setAppZoom: function () {
      return Sl;
    },
  });
  var wl = Pe(),
    Cl = (n) => {
      let e = n._camera;
      return e._cameraType === "OrthographicCamera"
        ? e.orthoCamera.zoom
        : e.perspCamera.zoom;
    },
    Sl = (n, e) => {
      let t = e > 0 ? e : wl.SPLINE_CONSTANTS.MIN_ZOOM_VALUE;
      n.setZoom?.(t);
    };
});
var xn = m((Rn) => {
  "use strict";
  Object.defineProperty(Rn, "__esModule", { value: !0 });
  Object.defineProperty(Rn, "createCleanupFunction", {
    enumerable: !0,
    get: function () {
      return Ml;
    },
  });
  var El = Ye(),
    Xe = ce(),
    Ml = (n, e, t, r, o, i) => () => {
      if (!(!n || !t)) {
        if (
          (i && (n.state = void 0),
          Object.assign(n.position, t.position),
          Object.assign(n.rotation, {
            x: t.rotation.x,
            y: t.rotation.y,
            z: t.rotation.z,
          }),
          Object.assign(n.scale, t.scale),
          t.color && (n.color = t.color),
          r.spline?.intensity &&
            typeof r.spline.intensity == "object" &&
            t.intensity !== void 0 &&
            (0, Xe.hasIntensity)(n) &&
            (n.intensity = t.intensity),
          r.spline?.zoom && typeof r.spline.zoom == "object")
        ) {
          let s = e.spline;
          typeof s?.setZoom == "function" && (0, El.setAppZoom)(s, o ?? 1);
        }
        if (t.materials) {
          let s = n.material,
            a = Array.isArray(s) ? s : s ? [s] : [];
          (0, Xe.hasRenderOrder)(n) && (n.renderOrder = t.renderOrder ?? 0);
          let c = Math.min(a.length, t.materials.length);
          for (let l = 0; l < c; l++) {
            let u = a[l],
              d = t.materials[l];
            if (!u || !d) continue;
            (u.transparent = d.transparent),
              (u.depthWrite = d.depthWrite),
              d.alpha !== void 0 && (u.alpha = d.alpha);
            let f = u.layers ?? [];
            for (let p = 0; p < f.length; p++) {
              let h = f[p],
                g = d.layers[p];
              !h ||
                !g ||
                ((h.visible = g.visible),
                g.alpha !== void 0 && (h.alpha = g.alpha),
                g.alphaOverride !== void 0 &&
                  (h.alphaOverride = g.alphaOverride),
                g.ior !== void 0 && (h.ior = g.ior),
                g.thickness !== void 0 && (h.thickness = g.thickness));
            }
          }
        }
        (0, Xe.hasMatrixUpdate)(n) &&
          (n.updateMatrix(), n.updateMatrixWorld(!0)),
          (0, Xe.hasBBoxUpdate)(n) &&
            ((n.singleBBoxNeedsUpdate = !0), (n.recursiveBBoxNeedsUpdate = !0)),
          e.spline.requestRender();
      }
    };
});
var Fi = m((Pn) => {
  "use strict";
  Object.defineProperty(Pn, "__esModule", { value: !0 });
  function Al(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Al(Pn, {
    warnNoObjectId: function () {
      return Ol;
    },
    warnNoObjectsFound: function () {
      return Il;
    },
    warnObjectNotFound: function () {
      return _l;
    },
  });
  var Ol = () => {},
    _l = (n) => {},
    Il = (n) => {};
});
var Bi = m((kn) => {
  "use strict";
  Object.defineProperty(kn, "__esModule", { value: !0 });
  Object.defineProperty(kn, "animateStateTransitions", {
    enumerable: !0,
    get: function () {
      return xl;
    },
  });
  var Li = Pe(),
    Rl = xn(),
    Di = ce(),
    xl = (n, e, t, r, o, i, s, a, c, l) => {
      let u = [];
      n.forEach((f) => {
        if (!f.transition) {
          u.push(null);
          return;
        }
        let p = c.duration ?? Li.SPLINE_CONSTANTS.DEFAULT_TRANSITION_DURATION,
          h = f.transition({
            from:
              e.stateName?.from && (0, Di.checkTt)(a, "from")
                ? e.stateName.from
                : void 0,
            to:
              e.stateName?.to && (0, Di.checkTt)(a, "to")
                ? e.stateName.to
                : null,
            autoPlay: !1,
            duration: p,
            delay: 0,
          });
        u.push(h);
        let g = { time: 0 };
        s.fromTo(
          g,
          { time: 0 },
          {
            ...c,
            time: p - Li.SPLINE_CONSTANTS.TRANSITION_END_OFFSET,
            onUpdate: () => {
              h.seek(g.time);
            },
          },
          l || 0
        );
      });
      let d = n.map((f, p) =>
        (0, Rl.createCleanupFunction)(f, t, r[p], o, i, u[p])
      );
      return () => d.forEach((f) => f?.());
    };
});
var Vi = m((Nn) => {
  "use strict";
  Object.defineProperty(Nn, "__esModule", { value: !0 });
  function Pl(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Pl(Nn, {
    animateColor: function () {
      return Ll;
    },
    animateIntensity: function () {
      return Nl;
    },
    animateZoom: function () {
      return Fl;
    },
  });
  var ji = Ye(),
    kl = An(),
    le = ce(),
    Nl = (n, e, t, r, o, i) => {
      let s = e.intensity;
      if (!s || typeof s != "object") return;
      let a = n.intensity ?? 0,
        c = s.from && (0, le.checkTt)(r, "from") ? s.from : a,
        l = s.to && (0, le.checkTt)(r, "to") ? s.to : a,
        u = { v: c };
      t.fromTo(
        u,
        { v: c },
        {
          ...o,
          v: l,
          onUpdate: () => {
            (0, le.hasIntensity)(n) && (n.intensity = u.v);
          },
        },
        i || 0
      );
    },
    Fl = (n, e, t, r, o, i) => {
      let s = e.zoom;
      if (!s || typeof s != "object" || typeof n.spline?.setZoom != "function")
        return;
      let a = (0, ji.getAppZoom)(n.spline),
        c = s.from && (0, le.checkTt)(r, "from") ? s.from : a,
        l = s.to && (0, le.checkTt)(r, "to") ? s.to : a,
        u = { v: c };
      t.fromTo(
        u,
        { v: c },
        {
          ...o,
          v: l,
          onUpdate: () => {
            (0, ji.setAppZoom)(n.spline, u.v);
          },
        },
        i || 0
      );
    },
    Ll = (n, e, t, r, o, i, s, a) => {
      let c = e.color;
      if (!c || typeof c != "object" || (!c.from && !c.to)) return;
      let l = s.spline._scene.entityByUuid[a]?.color,
        u = (0, kl.colorDataToCss)(l ?? { r: 255, g: 255, b: 255 }),
        d = c.from && (0, le.checkTt)(r, "from") ? c.from : u,
        f = c.to && (0, le.checkTt)(r, "to") ? c.to : u,
        p = window.gsap.utils.interpolate(d, f),
        h = { t: 0 };
      t.fromTo(
        h,
        { t: 0 },
        {
          ...o,
          t: 1,
          onUpdate: function () {
            n.color = p(h.t);
          },
        },
        i || 0
      );
    };
});
var qi = m((Fn) => {
  "use strict";
  Object.defineProperty(Fn, "__esModule", { value: !0 });
  function Dl(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  Dl(Fn, {
    createPropertyObject: function () {
      return Ui;
    },
    createTransformTargets: function () {
      return Bl;
    },
  });
  var Ui = (n, e, t) => {
      let r = {},
        o = t[e];
      return (
        ["X", "Y", "Z"].forEach((i) => {
          let s = `${e}${i}`,
            a = n[s],
            c = i.toLowerCase(),
            l = o[c];
          a &&
            typeof a == "object" &&
            (r[c] = { from: a.from ?? l, to: a.to ?? l });
        }),
        { props: r }
      );
    },
    Bl = (n, e) => {
      let t = ["position", "rotation", "scale"],
        r = [];
      return (
        t.forEach((o) => {
          let { props: i } = Ui(e, o, n);
          Object.keys(i).length > 0 && r.push({ object: n[o], props: i });
        }),
        r
      );
    };
});
var $i = m((Dn) => {
  "use strict";
  Object.defineProperty(Dn, "__esModule", { value: !0 });
  Object.defineProperty(Dn, "fadeObject", {
    enumerable: !0,
    get: function () {
      return $l;
    },
  });
  var Ze = Pe(),
    Ln = ce(),
    jl = (n, e, t, r, o, i) => {
      r.fromTo(n, { alpha: e }, { ...o, alpha: t }, i);
    },
    Vl = (n, e, t, r, o, i) => {
      let s = n.ior ?? Ze.SPLINE_CONSTANTS.DEFAULT_TRANSMISSION_IOR,
        a = n.thickness ?? Ze.SPLINE_CONSTANTS.DEFAULT_TRANSMISSION_THICKNESS;
      r.fromTo(
        n,
        { alpha: e, ior: s, thickness: a },
        {
          ...o,
          alpha: 1 - t,
          ior: window.gsap.utils.interpolate(s, 1, 1 - t),
          thickness: window.gsap.utils.interpolate(a, 0, 1 - t),
          onUpdate: () => {
            n.visible =
              n.alpha > Ze.SPLINE_CONSTANTS.OPACITY_TRANSPARENCY_THRESHOLD;
          },
        },
        i
      );
    },
    Ul = (n, e, t, r, o, i) => {
      n.alphaOverride !== void 0 &&
        r.fromTo(n, { alphaOverride: e }, { ...o, alphaOverride: t }, i);
    },
    ql = (n, e, t, r, o, i) => {
      if (!n.visible) return;
      let s = n.type;
      s === "color" || s === "depth" || s === "outline"
        ? jl(n, e, t, r, o, i)
        : s === "transmission"
        ? Vl(n, e, t, r, o, i)
        : s === "light" && Ul(n, e, t, r, o, i);
    },
    $l = (n, e, t, r, o, i) => {
      if (!n) return;
      let s = n.material,
        a = s?.layers;
      if (a) {
        (s.transparent = !0),
          (0, Ln.hasRenderOrder)(n) &&
            (n.renderOrder = Ze.SPLINE_CONSTANTS.OPACITY_RENDER_ORDER);
        for (let c of a) {
          let l = c.type === "light" ? c.alphaOverride ?? 1 : c.alpha ?? 1,
            u = e.from !== void 0 && (0, Ln.checkTt)(r, "from") ? e.from : l,
            d = e.to !== void 0 && (0, Ln.checkTt)(r, "to") ? e.to : l;
          ql(c, u, d, t, o, i);
        }
      }
    };
});
var Gi = m((Vn) => {
  "use strict";
  Object.defineProperty(Vn, "__esModule", { value: !0 });
  Object.defineProperty(Vn, "setupAnimation", {
    enumerable: !0,
    get: function () {
      return Zl;
    },
  });
  var Hl = Ni(),
    Gl = xn(),
    zl = Ye(),
    Bn = Fi(),
    Wl = Bi(),
    jn = Vi(),
    Yl = qi(),
    Xl = $i(),
    Qe = ce(),
    Hi = Pe(),
    Zl = (n, e, t, r, o, i) => {
      t.ease || (t = { ...t, ease: "none" });
      let { force3D: s, ...a } = t;
      if (((t = { ...a }), !n.spline?.findObjectById)) return;
      let c = e.spline,
        l = (e.objectId || "").split(",").filter(Boolean);
      if (l.length === 0) {
        (0, Bn.warnNoObjectId)();
        return;
      }
      let u = l.flatMap((g) => {
        let y = n.spline.findObjectById?.(g);
        return y || ((0, Bn.warnObjectNotFound)(g), []);
      });
      if (u.length === 0) {
        (0, Bn.warnNoObjectsFound)(l);
        return;
      }
      let d = u.map((g) => (0, Hl.storeOriginalState)(g, n, l[0] ?? "")),
        f = (0, zl.getAppZoom)(n.spline);
      if (
        e.animatingState &&
        c?.stateName &&
        (c.stateName.from || c.stateName.to)
      )
        return (0, Wl.animateStateTransitions)(u, c, n, d, e, f, r, o, t, i);
      if (!c) return;
      let p = Object.keys(c);
      if (p.length === 0 || (p.length === 1 && p[0] === "stateName")) return;
      u.forEach((g) => {
        (0, jn.animateIntensity)(g, c, r, o, t, i),
          (0, jn.animateZoom)(n, c, r, o, t, i),
          (0, jn.animateColor)(g, c, r, o, t, i, n, l[0] ?? "");
        let y = c.opacity && typeof c.opacity == "object" ? c.opacity : void 0;
        if (y !== void 0) {
          let M = {
              from: y.from !== void 0 ? y.from / 100 : void 0,
              to: y.to !== void 0 ? y.to / 100 : void 0,
            },
            S =
              t.immediateRender !== !1 &&
              M.from !== void 0 &&
              (0, Qe.checkTt)(o, "from")
                ? M.from
                : void 0;
          if (((0, Xl.fadeObject)(g, M, r, o, t, i), S !== void 0)) {
            let C = g.material,
              v = Array.isArray(C) ? C : C ? [C] : [];
            for (let T of v)
              (T.transparent = !0),
                (T.depthWrite =
                  S > Hi.SPLINE_CONSTANTS.OPACITY_TRANSPARENCY_THRESHOLD);
            (0, Qe.hasRenderOrder)(g) &&
              (g.renderOrder = Hi.SPLINE_CONSTANTS.OPACITY_RENDER_ORDER);
          }
        }
        (0, Yl.createTransformTargets)(g, c).forEach(
          ({ object: M, props: S }) => {
            if (Object.keys(S).length === 0) return;
            let C = {},
              v = {};
            Object.keys(S).forEach((T) => {
              let w = S[T];
              w &&
                typeof w == "object" &&
                ((C[T] =
                  (0, Qe.checkTt)(o, "from") && w.from ? w.from : M[T] ?? 0),
                (v[T] = (0, Qe.checkTt)(o, "to") && w.to ? w.to : M[T] ?? 0));
            }),
              !(Object.keys(C).length === 0 && Object.keys(v).length === 0) &&
                r.fromTo(M, C, { ...t, ...v }, i || 0);
          }
        );
      });
      let h = u.map((g, y) => (0, Gl.createCleanupFunction)(g, n, d[y], e, f));
      return () => h.forEach((g) => g?.());
    };
});
var Yi = m((Un) => {
  "use strict";
  Object.defineProperty(Un, "__esModule", { value: !0 });
  Object.defineProperty(Un, "buildSplineAction", {
    enumerable: !0,
    get: function () {
      return tu;
    },
  });
  var zi = Gi(),
    Ke = ve(),
    Ql = new Set(["color", "stateName"]),
    Kl = new Set(["rotationX", "rotationY", "rotationZ"]),
    Wi = Math.PI / 180;
  function Jl(n, e) {
    if (!n.spline) return n;
    let t = n.spline,
      r = {},
      o = !1;
    for (let [i, s] of Object.entries(t)) {
      if (!s || typeof s != "object") {
        r[i] = s;
        continue;
      }
      let a = s;
      if (Ql.has(i)) {
        let c = a.from !== void 0 ? (0, Ke.resolveToString)(a.from, e) : void 0,
          l = a.to !== void 0 ? (0, Ke.resolveToString)(a.to, e) : void 0;
        (c !== a.from || l !== a.to) && (o = !0), (r[i] = { from: c, to: l });
      } else {
        let c = a.from !== void 0 ? (0, Ke.resolveToNumber)(a.from, e) : void 0,
          l = a.to !== void 0 ? (0, Ke.resolveToNumber)(a.to, e) : void 0,
          u = c !== a.from,
          d = l !== a.to;
        (u || d) && (o = !0),
          Kl.has(i)
            ? (r[i] = {
                from: c !== void 0 && u ? c * Wi : c,
                to: l !== void 0 && d ? l * Wi : l,
              })
            : (r[i] = { from: c, to: l });
      }
    }
    return o ? { ...n, spline: r } : n;
  }
  function eu(n, e, t, r, o, i, s) {
    let a = e.getInstance(n);
    if (a) return (0, zi.setupAnimation)(a, t, r, o, i, s);
    let c,
      l = () => {
        let u = e.getInstance(n);
        u && (c = (0, zi.setupAnimation)(u, t, r, o, i, s)),
          n.removeEventListener("w-spline-load", l);
      };
    return (
      n.addEventListener("w-spline-load", l),
      () => {
        n.removeEventListener("w-spline-load", l), c?.();
      }
    );
  }
  function tu(n) {
    n.addAction("spline", {
      createCustomTween: (e, t, r, o, i, s) => {
        let a = t.tt ?? 0;
        if (!i.length || !window.Webflow || !r.objectId) return;
        let c = window.Webflow.require?.("spline");
        if (!c) return;
        let l = [];
        for (let u of i) {
          let d = Jl(r, u),
            f = eu(u, c, d, o, e, a, s);
          f && l.push(f);
        }
        if (l.length !== 0)
          return () => {
            for (let u of l) u?.();
          };
      },
    });
  }
});
var eo = m(($n) => {
  "use strict";
  Object.defineProperty($n, "__esModule", { value: !0 });
  Object.defineProperty($n, "buildVariableAction", {
    enumerable: !0,
    get: function () {
      return nu;
    },
  });
  var qn = X();
  function nu(n) {
    n.addAction("variable", {
      createCustomTween: (e, t, r, o, i, s) => {
        let a = r.variable;
        if (!a) return;
        let c = Object.keys(a),
          l = c.length;
        if (l === 0) return;
        let u = (t.targets?.length ?? 0) > 0;
        if (u && i.length === 0) return;
        let d = u ? Array.from(new Set(i)) : ru(c),
          f = d.length,
          p = new Array(f),
          h = new Array(f);
        for (let v = 0; v < f; v++) {
          let T = d[v].style;
          p[v] = T;
          let w = new Array(l);
          for (let _ = 0; _ < l; _++) {
            let I = c[_];
            (w[_] = T.getPropertyValue(I)), T.removeProperty(I);
          }
          h[v] = w;
        }
        let g = t.tt ?? qn.TweenType.To,
          y = s || 0,
          { force3D: E, ...M } = o,
          S = c.some((v) => a[v].startsWith("var(")),
          C = (v) => {
            let T = {};
            for (let w = 0; w < l; w++) {
              let _ = c[w],
                I = a[_];
              T[_] =
                (v &&
                  I.startsWith("var(") &&
                  v.getPropertyValue(I.slice(4, -1)).trim()) ||
                I;
            }
            return T;
          };
        if (u)
          for (let v = 0; v < f; v++) {
            let T = d[v],
              w = C(S ? getComputedStyle(T) : null);
            Xi(e, g, T, { ...w, ...M }, y);
          }
        else {
          let T = {
            ...C(S ? getComputedStyle(document.documentElement) : null),
            ...M,
          };
          for (let w = 0; w < f; w++) Xi(e, g, d[w], T, y);
        }
        return () => {
          for (let v = 0; v < f; v++) {
            let T = p[v],
              w = h[v];
            for (let _ = 0; _ < l; _++) {
              let I = w[_];
              I ? T.setProperty(c[_], I) : T.removeProperty(c[_]);
            }
          }
        };
      },
    });
  }
  function ru(n) {
    let e = [document.documentElement];
    if (n.length === 0) return e;
    let t = iu(n) ?? ou(n);
    for (let r = 0; r < t.length; r++) e.push(t[r]);
    return e;
  }
  function Xi(n, e, t, r, o) {
    e === qn.TweenType.From
      ? n.from(t, r, o)
      : e === qn.TweenType.Set
      ? n.set(t, r, o)
      : n.to(t, r, o);
  }
  function iu(n) {
    let e = new Set([document.documentElement]),
      t = [],
      r = new Map();
    try {
      let o = document.styleSheets;
      for (let i = 0; i < o.length; i++) Qi(o[i].cssRules, n, t, e, r);
      return t;
    } catch {
      return null;
    }
  }
  function Qi(n, e, t, r, o) {
    for (let i = 0; i < n.length; i++) {
      let s = n[i];
      if (s instanceof CSSMediaRule) {
        let c = s.conditionText,
          l = o.get(c);
        l === void 0 && ((l = matchMedia(c).matches), o.set(c, l)),
          l && Qi(s.cssRules, e, t, r, o);
        continue;
      }
      if (!(s instanceof CSSStyleRule)) continue;
      let a = s.style;
      for (let c = 0; c < e.length; c++)
        if (a.getPropertyValue(e[c])) {
          try {
            let l = document.querySelectorAll(s.selectorText);
            for (let u = 0; u < l.length; u++) {
              let d = l[u];
              r.has(d) || (r.add(d), t.push(d));
            }
          } catch {}
          break;
        }
    }
  }
  var Ki = "__ix3__";
  function ou(n) {
    let e = document.documentElement,
      t = document.body,
      r = [],
      o = n.length,
      i = [],
      s = [];
    Ji(e, n, o, i, s), Zi(t, n, o, r, i, s);
    let a = document.createTreeWalker(t, NodeFilter.SHOW_ELEMENT),
      c;
    for (; (c = a.nextNode()); ) Zi(c, n, o, r, i, s);
    for (let l = 0; l < i.length; l++) {
      let u = i[l].style,
        d = s[l];
      for (let f = 0; f < o; f++) {
        let p = d[f];
        p ? u.setProperty(n[f], p) : u.removeProperty(n[f]);
      }
    }
    return r;
  }
  function Ji(n, e, t, r, o) {
    let i = n.style,
      s = new Array(t);
    for (let a = 0; a < t; a++) {
      let c = e[a];
      (s[a] = i.getPropertyValue(c)), i.setProperty(c, Ki);
    }
    r.push(n), o.push(s);
  }
  function Zi(n, e, t, r, o, i) {
    let s = getComputedStyle(n);
    for (let a = 0; a < t; a++)
      if (s.getPropertyValue(e[a]) !== Ki) {
        r.push(n), Ji(n, e, t, o, i);
        return;
      }
  }
});
var to = m((Hn) => {
  "use strict";
  Object.defineProperty(Hn, "__esModule", { value: !0 });
  function su(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  su(Hn, {
    getFirst: function () {
      return au;
    },
    getSecond: function () {
      return cu;
    },
    pair: function () {
      return lu;
    },
  });
  var au = (n) => n[0],
    cu = (n) => n[1],
    lu = (n, e) => [n, e];
});
var zn = m((Gn) => {
  "use strict";
  Object.defineProperty(Gn, "__esModule", { value: !0 });
  function uu(n, e) {
    for (var t in e) Object.defineProperty(n, t, { enumerable: !0, get: e[t] });
  }
  uu(Gn, {
    elementTargetSelector: function () {
      return mu;
    },
    safeClosest: function () {
      return gu;
    },
    safeGetElementById: function () {
      return du;
    },
    safeMatches: function () {
      return hu;
    },
    safeQuerySelector: function () {
      return pu;
    },
    safeQuerySelectorAll: function () {
      return fu;
    },
  });
  var Je = Ve(),
    du = (n) => {
      try {
        let e = document.getElementById(n);
        return e && !(0, Je.isTransientIX3Clone)(e) ? e : null;
      } catch {
        return null;
      }
    },
    fu = (n, e) => {
      try {
        let t = e.querySelectorAll(n);
        if (t.length === 0) return [];
        let r = [];
        for (let o of t) (0, Je.isTransientIX3Clone)(o) || r.push(o);
        return r;
      } catch {
        return null;
      }
    },
    pu = (n, e) => {
      try {
        let t = e.querySelector(n);
        if (!t) return null;
        if (!(0, Je.isTransientIX3Clone)(t)) return t;
        let r = e.querySelectorAll(n);
        for (let o of r) if (!(0, Je.isTransientIX3Clone)(o)) return o;
        return null;
      } catch {
        return null;
      }
    },
    gu = (n, e) => {
      try {
        return n.closest(e);
      } catch {
        return null;
      }
    },
    hu = (n, e) => {
      try {
        return n.matches(e);
      } catch {
        return null;
      }
    },
    mu = (n) => `[data-wf-target*="${CSS.escape(`[${JSON.stringify(n)}`)}"]`;
});
var no = m((Wn) => {
  "use strict";
  Object.defineProperty(Wn, "__esModule", { value: !0 });
  Object.defineProperty(Wn, "applyScope", {
    enumerable: !0,
    get: function () {
      return vu;
    },
  });
  var Q = te(),
    et = zn(),
    yu = Ve(),
    W = (n) => n.filter((e) => !(0, yu.isTransientIX3Clone)(e)),
    vu = (n, e) => {
      let t = W(n);
      if (!e) return t;
      if (Array.isArray(e)) {
        let [r, o] = e,
          i = [];
        switch (r) {
          case Q.TargetScope.FIRST_ANCESTOR:
            for (let s of t) {
              let a = o ? (0, et.safeClosest)(s, o) : null;
              a && i.push(a);
            }
            return W(i);
          case Q.TargetScope.FIRST_DESCENDANT:
            for (let s of t) {
              let a = o ? (0, et.safeQuerySelector)(o, s) : s.firstElementChild;
              a && i.push(a);
            }
            return W(i);
          case Q.TargetScope.DESCENDANTS:
            for (let s of t)
              i.push(...((0, et.safeQuerySelectorAll)(o, s) || []));
            return W(i);
          case Q.TargetScope.ANCESTORS:
            for (let s of t) {
              let a = s.parentElement;
              for (; a; )
                (!o || (0, et.safeMatches)(a, o)) && i.push(a),
                  (a = a.parentElement);
            }
            return W(i);
        }
      }
      switch (e) {
        case Q.TargetScope.CHILDREN:
          return W(t.flatMap((r) => [...r.children]));
        case Q.TargetScope.PARENT:
          return W(t.map((r) => r.parentElement).filter(Boolean));
        case Q.TargetScope.SIBLINGS:
          return W(
            t.flatMap((r) =>
              r.parentElement
                ? [...r.parentElement.children].filter((o) => o !== r)
                : []
            )
          );
        case Q.TargetScope.NEXT:
          return W(t.flatMap((r) => r.nextElementSibling || []));
        case Q.TargetScope.PREVIOUS:
          return W(t.flatMap((r) => r.previousElementSibling || []));
        default:
          return t;
      }
    };
});
var ro = m((Yn) => {
  "use strict";
  Object.defineProperty(Yn, "__esModule", { value: !0 });
  Object.defineProperty(Yn, "build", {
    enumerable: !0,
    get: function () {
      return bu;
    },
  });
  var be = to(),
    Te = zn(),
    re = no();
  function bu(n) {
    let e = [];
    n.addTargetResolver("id", {
      resolve: ([, t]) => {
        let [r, o] = Array.isArray(t) ? t : [t],
          i = r ? (0, Te.safeGetElementById)(r) : null;
        return i ? (0, re.applyScope)([i], o) : e;
      },
    })
      .addTargetResolver("trigger-only", {
        resolve: ([, t], { triggerElement: r }) =>
          r ? (0, re.applyScope)([r], Array.isArray(t) ? t[1] : void 0) : e,
        isDynamic: !0,
      })
      .addTargetResolver("trigger-only-parent", {
        resolve: ([, t], { triggerElement: r }) => {
          if (!r) return e;
          let o = r.parentElement;
          return o instanceof HTMLElement
            ? (0, re.applyScope)([o], Array.isArray(t) ? t[1] : void 0)
            : e;
        },
        isDynamic: !0,
      })
      .addTargetResolver("inst", {
        resolve: ([, t], { triggerElement: r }) => {
          if (!Array.isArray(t)) return e;
          let [o, i] = t,
            s = Array.isArray(o),
            a = s ? (0, be.pair)(o[0], o[1]) : (0, be.pair)(o, i),
            c = (0, Te.safeQuerySelectorAll)(
              (0, Te.elementTargetSelector)(a),
              document
            );
          if (!c?.length) return e;
          let l = [...c];
          if (!r) return (0, re.applyScope)(l, s ? i : void 0);
          let u = r.dataset.wfTarget;
          if (!u) return l;
          try {
            let d = JSON.parse(u),
              f = (0, be.getFirst)(a),
              p = d.find((h) => (0, be.getFirst)((0, be.getFirst)(h)) === f);
            return p
              ? (0, re.applyScope)(
                  l.filter((h) =>
                    (h.dataset.wfTarget || "").includes(
                      `${JSON.stringify((0, be.getSecond)(p))}]`
                    )
                  ),
                  s ? i : void 0
                )
              : e;
          } catch {
            return e;
          }
        },
        isDynamic: !0,
      })
      .addTargetResolver("class", {
        resolve: ([, t]) => {
          let [r, o] = Array.isArray(t) ? t : [t],
            i = r ? (0, Te.safeQuerySelectorAll)(`.${r}`, document) : null;
          return i ? (0, re.applyScope)([...i], o) : e;
        },
      })
      .addTargetResolver("selector", {
        resolve: ([, t]) => {
          let [r, o] = Array.isArray(t) ? t : [t],
            i = r ? (0, Te.safeQuerySelectorAll)(r, document) : null;
          return i ? (0, re.applyScope)([...i], o) : e;
        },
      })
      .addTargetResolver("body", { resolve: () => [document.body] })
      .addTargetResolver("attribute", {
        resolve: ([, t]) => {
          let [r, o] = Array.isArray(t) ? t : [t],
            i = r ? (0, Te.safeQuerySelectorAll)(r, document) : null;
          return i ? (0, re.applyScope)([...i], o) : e;
        },
      })
      .addTargetResolver("any-element", { resolve: () => e })
      .addTargetResolver("viewport", {
        resolve: () => [document.documentElement],
      });
  }
});
var oo = m((Xn) => {
  "use strict";
  Object.defineProperty(Xn, "__esModule", { value: !0 });
  Object.defineProperty(Xn, "plugin", {
    enumerable: !0,
    get: function () {
      return _u;
    },
  });
  var Tu = si(),
    wu = fi(),
    Cu = hi(),
    io = ki(),
    Su = Yi(),
    Eu = eo(),
    Mu = ro(),
    Au = X(),
    Ou = te(),
    K = new Au.RuntimeBuilder(Ou.CORE_PLUGIN_INFO);
  (0, Tu.build)(K);
  (0, wu.build)(K);
  (0, Cu.buildLottieAction)(K);
  (0, io.buildRiveAction)(K);
  (0, io.buildAnimateRiveAction)(K);
  (0, Su.buildSplineAction)(K);
  (0, Eu.buildVariableAction)(K);
  (0, Mu.build)(K);
  var _u = K.buildRuntime();
});
var so = m((Zn) => {
  "use strict";
  Object.defineProperty(Zn, "__esModule", { value: !0 });
  Object.defineProperty(Zn, "plugin", {
    enumerable: !0,
    get: function () {
      return Iu.plugin;
    },
  });
  var Iu = oo();
});
var ao = tr(xr()),
  co = tr(so());
async function Ru() {
  try {
    let n = await ao.IX3.init({ doc: document, win: window });
    return (
      await n.registerPlugin(co.plugin),
      { register: (e, t) => n.register(e, t), destroy: () => n.destroy() }
    );
  } catch (n) {
    throw (console.error("[Devlink IX3] Engine initialization failed:", n), n);
  }
}
var Tf = { createIX3Engine: Ru };
export { Ru as createIX3Engine, Tf as default };

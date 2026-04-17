import { jsx, jsxs, Fragment as Fragment$1 } from "react/jsx-runtime";
import React2, { createContext, forwardRef, useRef, useMemo, useState, useEffect, useImperativeHandle, createElement, useCallback, useLayoutEffect, Fragment, useContext } from "react";
import { config as config$1, isUrlMethodPair, mergeDataIntoQueryString, getScrollableParent, useInfiniteScroll, router, UseFormUtils, formDataToObject, FormComponentResetSymbol, resetFormFields, shouldIntercept, shouldNavigate, getInitialPageFromDOM, setupProgress, createHeadManager } from "@inertiajs/core";
import { flushSync } from "react-dom";
import { cloneDeep, isEqual, set, has, get, escape } from "lodash-es";
import { createValidator, toSimpleValidationErrors, resolveName } from "laravel-precognition";
import axios from "axios";
import ReactQuill from "react-quill-new";
import createServer from "@inertiajs/core/server";
import ReactDOMServer from "react-dom/server";
var headContext = createContext(null);
headContext.displayName = "InertiaHeadContext";
var HeadContext_default = headContext;
var pageContext = createContext(null);
pageContext.displayName = "InertiaPageContext";
var PageContext_default = pageContext;
var currentIsInitialPage = true;
var routerIsInitialized = false;
var swapComponent = async () => {
  currentIsInitialPage = false;
};
function App({
  children,
  initialPage,
  initialComponent,
  resolveComponent,
  titleCallback,
  onHeadUpdate
}) {
  const [current, setCurrent] = useState({
    component: initialComponent || null,
    page: { ...initialPage, flash: initialPage.flash ?? {} },
    key: null
  });
  const headManager = useMemo(() => {
    return createHeadManager(
      typeof window === "undefined",
      titleCallback || ((title) => title),
      onHeadUpdate || (() => {
      })
    );
  }, []);
  if (!routerIsInitialized) {
    router.init({
      initialPage,
      resolveComponent,
      swapComponent: async (args) => swapComponent(args),
      onFlash: (flash) => {
        setCurrent((current2) => ({
          ...current2,
          page: { ...current2.page, flash }
        }));
      }
    });
    routerIsInitialized = true;
  }
  useEffect(() => {
    swapComponent = async ({ component, page, preserveState }) => {
      if (currentIsInitialPage) {
        currentIsInitialPage = false;
        return;
      }
      flushSync(
        () => setCurrent((current2) => ({
          component,
          page,
          key: preserveState ? current2.key : Date.now()
        }))
      );
    };
    router.on("navigate", () => headManager.forceUpdate());
  }, []);
  if (!current.component) {
    return createElement(
      HeadContext_default.Provider,
      { value: headManager },
      createElement(PageContext_default.Provider, { value: current.page }, null)
    );
  }
  const renderChildren = children || (({ Component, props, key }) => {
    const child = createElement(Component, { key, ...props });
    if (typeof Component.layout === "function") {
      return Component.layout(child);
    }
    if (Array.isArray(Component.layout)) {
      return Component.layout.concat(child).reverse().reduce((children2, Layout) => createElement(Layout, { children: children2, ...props }));
    }
    return child;
  });
  return createElement(
    HeadContext_default.Provider,
    { value: headManager },
    createElement(
      PageContext_default.Provider,
      { value: current.page },
      renderChildren({
        Component: current.component,
        key: current.key,
        props: current.page.props
      })
    )
  );
}
App.displayName = "Inertia";
async function createInertiaApp({
  id = "app",
  resolve,
  setup,
  title,
  progress: progress2 = {},
  page,
  render,
  defaults = {}
}) {
  config.replace(defaults);
  const isServer = typeof window === "undefined";
  const useScriptElementForInitialPage = config.get("future.useScriptElementForInitialPage");
  const initialPage = page || getInitialPageFromDOM(id, useScriptElementForInitialPage);
  const resolveComponent = (name) => Promise.resolve(resolve(name)).then((module) => module.default || module);
  let head = [];
  const reactApp = await Promise.all([
    resolveComponent(initialPage.component),
    router.decryptHistory().catch(() => {
    })
  ]).then(([initialComponent]) => {
    const props = {
      initialPage,
      initialComponent,
      resolveComponent,
      titleCallback: title
    };
    if (isServer) {
      const ssrSetup = setup;
      return ssrSetup({
        el: null,
        App,
        props: { ...props, onHeadUpdate: (elements) => head = elements }
      });
    }
    const csrSetup = setup;
    return csrSetup({
      el: document.getElementById(id),
      App,
      props
    });
  });
  if (!isServer && progress2) {
    setupProgress(progress2);
  }
  if (isServer && render) {
    const element = () => {
      if (!useScriptElementForInitialPage) {
        return createElement(
          "div",
          {
            id,
            "data-page": JSON.stringify(initialPage)
          },
          reactApp
        );
      }
      return createElement(
        Fragment,
        null,
        createElement("script", {
          "data-page": id,
          type: "application/json",
          dangerouslySetInnerHTML: { __html: JSON.stringify(initialPage).replace(/\//g, "\\/") }
        }),
        createElement("div", { id }, reactApp)
      );
    };
    const body = await render(element());
    return { head, body };
  }
}
function useIsomorphicLayoutEffect(effect, deps) {
  typeof window === "undefined" ? useEffect(effect, deps) : useLayoutEffect(effect, deps);
}
var isReact19 = typeof React2.use === "function";
function usePage() {
  const page = isReact19 ? React2.use(PageContext_default) : React2.useContext(PageContext_default);
  if (!page) {
    throw new Error("usePage must be used within the Inertia component");
  }
  return page;
}
function useRemember(initialState, key, excludeKeysRef) {
  const [state, setState] = useState(() => {
    const restored = router.restore(key);
    return restored !== void 0 ? restored : initialState;
  });
  useEffect(() => {
    const keys = excludeKeysRef?.current;
    if (keys && keys.length > 0 && typeof state === "object" && state !== null) {
      const filtered = { ...state };
      keys.forEach((k) => delete filtered[k]);
      router.remember(filtered, key);
    } else {
      router.remember(state, key);
    }
  }, [state, key]);
  return [state, setState];
}
function useForm(...args) {
  const isMounted = useRef(false);
  const parsedArgs = UseFormUtils.parseUseFormArguments(...args);
  const { rememberKey, data: initialData } = parsedArgs;
  const precognitionEndpoint = useRef(parsedArgs.precognitionEndpoint);
  const [defaults, setDefaults] = useState(
    typeof initialData === "function" ? cloneDeep(initialData()) : cloneDeep(initialData)
  );
  const cancelToken = useRef(null);
  const recentlySuccessfulTimeoutId = useRef(void 0);
  const excludeKeysRef = useRef([]);
  const [data, setData] = rememberKey ? useRemember(defaults, `${rememberKey}:data`, excludeKeysRef) : useState(defaults);
  const [errors, setErrors] = rememberKey ? useRemember({}, `${rememberKey}:errors`) : useState({});
  const [hasErrors, setHasErrors] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress2, setProgress] = useState(null);
  const [wasSuccessful, setWasSuccessful] = useState(false);
  const [recentlySuccessful, setRecentlySuccessful] = useState(false);
  const transform = useRef((data2) => data2);
  const isDirty = useMemo(() => !isEqual(data, defaults), [data, defaults]);
  const validatorRef = useRef(null);
  const [validating, setValidating] = useState(false);
  const [touchedFields, setTouchedFields] = useState([]);
  const [validFields, setValidFields] = useState([]);
  const withAllErrors = useRef(null);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  const setDefaultsCalledInOnSuccess = useRef(false);
  const submit = useCallback(
    (...args2) => {
      const { method, url, options } = UseFormUtils.parseSubmitArguments(args2, precognitionEndpoint.current);
      setDefaultsCalledInOnSuccess.current = false;
      const _options = {
        ...options,
        onCancelToken: (token) => {
          cancelToken.current = token;
          if (options.onCancelToken) {
            return options.onCancelToken(token);
          }
        },
        onBefore: (visit) => {
          setWasSuccessful(false);
          setRecentlySuccessful(false);
          clearTimeout(recentlySuccessfulTimeoutId.current);
          if (options.onBefore) {
            return options.onBefore(visit);
          }
        },
        onStart: (visit) => {
          setProcessing(true);
          if (options.onStart) {
            return options.onStart(visit);
          }
        },
        onProgress: (event) => {
          setProgress(event || null);
          if (options.onProgress) {
            return options.onProgress(event);
          }
        },
        onSuccess: async (page) => {
          if (isMounted.current) {
            setProcessing(false);
            setProgress(null);
            setErrors({});
            setHasErrors(false);
            setWasSuccessful(true);
            setRecentlySuccessful(true);
            recentlySuccessfulTimeoutId.current = setTimeout(() => {
              if (isMounted.current) {
                setRecentlySuccessful(false);
              }
            }, config.get("form.recentlySuccessfulDuration"));
          }
          const onSuccess = options.onSuccess ? await options.onSuccess(page) : null;
          if (isMounted.current && !setDefaultsCalledInOnSuccess.current) {
            setData((data2) => {
              setDefaults(cloneDeep(data2));
              return data2;
            });
          }
          return onSuccess;
        },
        onError: (errors2) => {
          if (isMounted.current) {
            setProcessing(false);
            setProgress(null);
            setErrors(errors2);
            setHasErrors(Object.keys(errors2).length > 0);
            validatorRef.current?.setErrors(errors2);
          }
          if (options.onError) {
            return options.onError(errors2);
          }
        },
        onCancel: () => {
          if (isMounted.current) {
            setProcessing(false);
            setProgress(null);
          }
          if (options.onCancel) {
            return options.onCancel();
          }
        },
        onFinish: (visit) => {
          if (isMounted.current) {
            setProcessing(false);
            setProgress(null);
          }
          cancelToken.current = null;
          if (options.onFinish) {
            return options.onFinish(visit);
          }
        }
      };
      const transformedData = transform.current(data);
      if (method === "delete") {
        router.delete(url, { ..._options, data: transformedData });
      } else {
        router[method](url, transformedData, _options);
      }
    },
    [data, setErrors, transform]
  );
  const setDataFunction = useCallback(
    (keyOrData, maybeValue) => {
      if (typeof keyOrData === "string") {
        setData((data2) => set(cloneDeep(data2), keyOrData, maybeValue));
      } else if (typeof keyOrData === "function") {
        setData((data2) => keyOrData(data2));
      } else {
        setData(keyOrData);
      }
    },
    [setData]
  );
  const [dataAsDefaults, setDataAsDefaults] = useState(false);
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  });
  const setDefaultsFunction = useCallback(
    (fieldOrFields, maybeValue) => {
      setDefaultsCalledInOnSuccess.current = true;
      let newDefaults = {};
      if (typeof fieldOrFields === "undefined") {
        newDefaults = { ...dataRef.current };
        setDefaults(dataRef.current);
        setDataAsDefaults(true);
      } else {
        setDefaults((defaults2) => {
          newDefaults = typeof fieldOrFields === "string" ? set(cloneDeep(defaults2), fieldOrFields, maybeValue) : Object.assign(cloneDeep(defaults2), fieldOrFields);
          return newDefaults;
        });
      }
      validatorRef.current?.defaults(newDefaults);
    },
    [setDefaults]
  );
  useIsomorphicLayoutEffect(() => {
    if (!dataAsDefaults) {
      return;
    }
    if (isDirty) {
      setDefaults(data);
    }
    setDataAsDefaults(false);
  }, [dataAsDefaults]);
  const reset = useCallback(
    (...fields) => {
      if (fields.length === 0) {
        setData(defaults);
      } else {
        setData(
          (data2) => fields.filter((key) => has(defaults, key)).reduce(
            (carry, key) => {
              return set(carry, key, get(defaults, key));
            },
            { ...data2 }
          )
        );
      }
      validatorRef.current?.reset(...fields);
    },
    [setData, defaults]
  );
  const setError = useCallback(
    (fieldOrFields, maybeValue) => {
      setErrors((errors2) => {
        const newErrors = {
          ...errors2,
          ...typeof fieldOrFields === "string" ? { [fieldOrFields]: maybeValue } : fieldOrFields
        };
        setHasErrors(Object.keys(newErrors).length > 0);
        validatorRef.current?.setErrors(newErrors);
        return newErrors;
      });
    },
    [setErrors, setHasErrors]
  );
  const clearErrors = useCallback(
    (...fields) => {
      setErrors((errors2) => {
        const newErrors = Object.keys(errors2).reduce(
          (carry, field) => ({
            ...carry,
            ...fields.length > 0 && !fields.includes(field) ? { [field]: errors2[field] } : {}
          }),
          {}
        );
        setHasErrors(Object.keys(newErrors).length > 0);
        if (validatorRef.current) {
          if (fields.length === 0) {
            validatorRef.current.setErrors({});
          } else {
            fields.forEach(validatorRef.current.forgetError);
          }
        }
        return newErrors;
      });
    },
    [setErrors, setHasErrors]
  );
  const resetAndClearErrors = useCallback(
    (...fields) => {
      reset(...fields);
      clearErrors(...fields);
    },
    [reset, clearErrors]
  );
  const createSubmitMethod = (method) => (url, options = {}) => {
    submit(method, url, options);
  };
  const getMethod = useCallback(createSubmitMethod("get"), [submit]);
  const post = useCallback(createSubmitMethod("post"), [submit]);
  const put = useCallback(createSubmitMethod("put"), [submit]);
  const patch = useCallback(createSubmitMethod("patch"), [submit]);
  const deleteMethod = useCallback(createSubmitMethod("delete"), [submit]);
  const cancel = useCallback(() => {
    if (cancelToken.current) {
      cancelToken.current.cancel();
    }
  }, []);
  const transformFunction = useCallback((callback) => {
    transform.current = callback;
  }, []);
  const form = {
    data,
    setData: setDataFunction,
    isDirty,
    errors,
    hasErrors,
    processing,
    progress: progress2,
    wasSuccessful,
    recentlySuccessful,
    transform: transformFunction,
    setDefaults: setDefaultsFunction,
    reset,
    setError,
    clearErrors,
    resetAndClearErrors,
    submit,
    get: getMethod,
    post,
    put,
    patch,
    delete: deleteMethod,
    cancel,
    dontRemember: (...keys) => {
      excludeKeysRef.current = keys;
      return form;
    }
  };
  const tap = (value, callback) => {
    callback(value);
    return value;
  };
  const valid = useCallback(
    (field) => validFields.includes(field),
    [validFields]
  );
  const invalid = useCallback((field) => field in errors, [errors]);
  const touched = useCallback(
    (field) => typeof field === "string" ? touchedFields.includes(field) : touchedFields.length > 0,
    [touchedFields]
  );
  const validate = (field, config3) => {
    if (typeof field === "object" && !("target" in field)) {
      config3 = field;
      field = void 0;
    }
    if (field === void 0) {
      validatorRef.current.validate(config3);
    } else {
      const fieldName = resolveName(field);
      const currentData = dataRef.current;
      const transformedData = transform.current(currentData);
      validatorRef.current.validate(fieldName, get(transformedData, fieldName), config3);
    }
    return form;
  };
  const withPrecognition = (...args2) => {
    precognitionEndpoint.current = UseFormUtils.createWayfinderCallback(...args2);
    if (!validatorRef.current) {
      const validator = createValidator((client2) => {
        const { method, url } = precognitionEndpoint.current();
        const currentData = dataRef.current;
        const transformedData = transform.current(currentData);
        return client2[method](url, transformedData);
      }, cloneDeep(defaults));
      validatorRef.current = validator;
      validator.on("validatingChanged", () => {
        setValidating(validator.validating());
      }).on("validatedChanged", () => {
        setValidFields(validator.valid());
      }).on("touchedChanged", () => {
        setTouchedFields(validator.touched());
      }).on("errorsChanged", () => {
        const validationErrors = withAllErrors.current ?? config.get("form.withAllErrors") ? validator.errors() : toSimpleValidationErrors(validator.errors());
        setErrors(validationErrors);
        setHasErrors(Object.keys(validationErrors).length > 0);
        setValidFields(validator.valid());
      });
    }
    const precognitiveForm = Object.assign(form, {
      validating,
      validator: () => validatorRef.current,
      valid,
      invalid,
      touched,
      withoutFileValidation: () => tap(precognitiveForm, () => validatorRef.current?.withoutFileValidation()),
      touch: (field, ...fields) => {
        if (Array.isArray(field)) {
          validatorRef.current?.touch(field);
        } else if (typeof field === "string") {
          validatorRef.current?.touch([field, ...fields]);
        } else {
          validatorRef.current?.touch(field);
        }
        return precognitiveForm;
      },
      withAllErrors: () => tap(precognitiveForm, () => withAllErrors.current = true),
      setValidationTimeout: (duration) => tap(precognitiveForm, () => validatorRef.current?.setTimeout(duration)),
      validateFiles: () => tap(precognitiveForm, () => validatorRef.current?.validateFiles()),
      validate,
      setErrors: (errors2) => tap(precognitiveForm, () => form.setError(errors2)),
      forgetError: (field) => tap(
        precognitiveForm,
        () => form.clearErrors(resolveName(field))
      )
    });
    return precognitiveForm;
  };
  form.withPrecognition = withPrecognition;
  return precognitionEndpoint.current ? form.withPrecognition(precognitionEndpoint.current) : form;
}
var deferStateUpdate = (callback) => {
  typeof React2.startTransition === "function" ? React2.startTransition(callback) : setTimeout(callback, 0);
};
var noop = () => void 0;
var FormContext = createContext(void 0);
var Form = forwardRef(
  ({
    action = "",
    method = "get",
    headers = {},
    queryStringArrayFormat = "brackets",
    errorBag = null,
    showProgress = true,
    transform = (data) => data,
    options = {},
    onStart = noop,
    onProgress = noop,
    onFinish = noop,
    onBefore = noop,
    onCancel = noop,
    onSuccess = noop,
    onError = noop,
    onCancelToken = noop,
    onSubmitComplete = noop,
    disableWhileProcessing = false,
    resetOnError = false,
    resetOnSuccess = false,
    setDefaultsOnSuccess = false,
    invalidateCacheTags = [],
    validateFiles = false,
    validationTimeout = 1500,
    withAllErrors = null,
    children,
    ...props
  }, ref) => {
    const getTransformedData = () => {
      const [_url, data] = getUrlAndData();
      return transform(data);
    };
    const form = useForm({}).withPrecognition(
      () => resolvedMethod,
      () => getUrlAndData()[0]
    ).setValidationTimeout(validationTimeout);
    if (validateFiles) {
      form.validateFiles();
    }
    if (withAllErrors ?? config$1.get("form.withAllErrors")) {
      form.withAllErrors();
    }
    form.transform(getTransformedData);
    const formElement = useRef(void 0);
    const resolvedMethod = useMemo(() => {
      return isUrlMethodPair(action) ? action.method : method.toLowerCase();
    }, [action, method]);
    const [isDirty, setIsDirty] = useState(false);
    const defaultData = useRef(new FormData());
    const getFormData = (submitter) => new FormData(formElement.current, submitter);
    const getData = (submitter) => formDataToObject(getFormData(submitter));
    const getUrlAndData = (submitter) => {
      return mergeDataIntoQueryString(
        resolvedMethod,
        isUrlMethodPair(action) ? action.url : action,
        getData(submitter),
        queryStringArrayFormat
      );
    };
    const updateDirtyState = (event) => {
      if (event.type === "reset" && event.detail?.[FormComponentResetSymbol]) {
        event.preventDefault();
      }
      deferStateUpdate(
        () => setIsDirty(event.type === "reset" ? false : !isEqual(getData(), formDataToObject(defaultData.current)))
      );
    };
    const clearErrors = (...names) => {
      form.clearErrors(...names);
      return form;
    };
    useEffect(() => {
      defaultData.current = getFormData();
      form.setDefaults(getData());
      const formEvents = ["input", "change", "reset"];
      formEvents.forEach((e) => formElement.current.addEventListener(e, updateDirtyState));
      return () => {
        formEvents.forEach((e) => formElement.current?.removeEventListener(e, updateDirtyState));
      };
    }, []);
    useEffect(() => {
      form.setValidationTimeout(validationTimeout);
    }, [validationTimeout]);
    useEffect(() => {
      if (validateFiles) {
        form.validateFiles();
      } else {
        form.withoutFileValidation();
      }
    }, [validateFiles]);
    const reset = (...fields) => {
      if (formElement.current) {
        resetFormFields(formElement.current, defaultData.current, fields);
      }
      form.reset(...fields);
    };
    const resetAndClearErrors = (...fields) => {
      clearErrors(...fields);
      reset(...fields);
    };
    const maybeReset = (resetOption) => {
      if (!resetOption) {
        return;
      }
      if (resetOption === true) {
        reset();
      } else if (resetOption.length > 0) {
        reset(...resetOption);
      }
    };
    const submit = (submitter) => {
      const [url, data] = getUrlAndData(submitter);
      const formTarget = submitter?.getAttribute("formtarget");
      if (formTarget === "_blank" && resolvedMethod === "get") {
        window.open(url, "_blank");
        return;
      }
      const submitOptions = {
        headers,
        queryStringArrayFormat,
        errorBag,
        showProgress,
        invalidateCacheTags,
        onCancelToken,
        onBefore,
        onStart,
        onProgress,
        onFinish,
        onCancel,
        onSuccess: (...args) => {
          onSuccess(...args);
          onSubmitComplete({
            reset,
            defaults
          });
          maybeReset(resetOnSuccess);
          if (setDefaultsOnSuccess === true) {
            defaults();
          }
        },
        onError(...args) {
          onError(...args);
          maybeReset(resetOnError);
        },
        ...options
      };
      form.transform(() => transform(data));
      form.submit(resolvedMethod, url, submitOptions);
      form.transform(getTransformedData);
    };
    const defaults = () => {
      defaultData.current = getFormData();
      setIsDirty(false);
    };
    const exposed = {
      errors: form.errors,
      hasErrors: form.hasErrors,
      processing: form.processing,
      progress: form.progress,
      wasSuccessful: form.wasSuccessful,
      recentlySuccessful: form.recentlySuccessful,
      isDirty,
      clearErrors,
      resetAndClearErrors,
      setError: form.setError,
      reset,
      submit,
      defaults,
      getData,
      getFormData,
      // Precognition
      validator: () => form.validator(),
      validating: form.validating,
      valid: form.valid,
      invalid: form.invalid,
      validate: (field, config3) => form.validate(...UseFormUtils.mergeHeadersForValidation(field, config3, headers)),
      touch: form.touch,
      touched: form.touched
    };
    useImperativeHandle(ref, () => exposed, [form, isDirty, submit]);
    const formNode = createElement(
      "form",
      {
        ...props,
        ref: formElement,
        action: isUrlMethodPair(action) ? action.url : action,
        method: resolvedMethod,
        onSubmit: (event) => {
          event.preventDefault();
          submit(event.nativeEvent.submitter);
        },
        // React 19 supports passing a boolean to the `inert` attribute, but shows
        // a warning when receiving a string. Earlier versions require the string 'true'.
        // See: https://github.com/inertiajs/inertia/pull/2536
        inert: disableWhileProcessing && form.processing && (isReact19 ? true : "true")
      },
      typeof children === "function" ? children(exposed) : children
    );
    return createElement(FormContext.Provider, { value: exposed }, formNode);
  }
);
Form.displayName = "InertiaForm";
var Head = function({ children, title }) {
  const headManager = useContext(HeadContext_default);
  const provider = useMemo(() => headManager.createProvider(), [headManager]);
  const isServer = typeof window === "undefined";
  useEffect(() => {
    provider.reconnect();
    provider.update(renderNodes(children));
    return () => {
      provider.disconnect();
    };
  }, [provider, children, title]);
  function isUnaryTag(node) {
    return typeof node.type === "string" && [
      "area",
      "base",
      "br",
      "col",
      "embed",
      "hr",
      "img",
      "input",
      "keygen",
      "link",
      "meta",
      "param",
      "source",
      "track",
      "wbr"
    ].indexOf(node.type) > -1;
  }
  function renderTagStart(node) {
    const attrs = Object.keys(node.props).reduce((carry, name) => {
      if (["head-key", "children", "dangerouslySetInnerHTML"].includes(name)) {
        return carry;
      }
      const value = String(node.props[name]);
      if (value === "") {
        return carry + ` ${name}`;
      }
      return carry + ` ${name}="${escape(value)}"`;
    }, "");
    return `<${String(node.type)}${attrs}>`;
  }
  function renderTagChildren(node) {
    const { children: children2 } = node.props;
    if (typeof children2 === "string") {
      return children2;
    }
    if (Array.isArray(children2)) {
      return children2.reduce((html, child) => html + renderTag(child), "");
    }
    return "";
  }
  function renderTag(node) {
    let html = renderTagStart(node);
    if (node.props.children) {
      html += renderTagChildren(node);
    }
    if (node.props.dangerouslySetInnerHTML) {
      html += node.props.dangerouslySetInnerHTML.__html;
    }
    if (!isUnaryTag(node)) {
      html += `</${String(node.type)}>`;
    }
    return html;
  }
  function ensureNodeHasInertiaProp(node) {
    return React2.cloneElement(node, {
      [provider.preferredAttribute()]: node.props["head-key"] !== void 0 ? node.props["head-key"] : ""
    });
  }
  function renderNode(node) {
    return renderTag(ensureNodeHasInertiaProp(node));
  }
  function renderNodes(nodes) {
    const elements = React2.Children.toArray(nodes).filter((node) => node).map((node) => renderNode(node));
    if (title && !elements.find((tag) => tag.startsWith("<title"))) {
      elements.push(`<title ${provider.preferredAttribute()}>${title}</title>`);
    }
    return elements;
  }
  if (isServer) {
    provider.update(renderNodes(children));
  }
  return null;
};
var Head_default = Head;
var resolveHTMLElement = (value, fallback) => {
  if (!value) {
    return fallback;
  }
  if (value && typeof value === "object" && "current" in value) {
    return value.current;
  }
  if (typeof value === "string") {
    return document.querySelector(value);
  }
  return fallback;
};
var renderSlot = (slotContent, slotProps, fallback = null) => {
  if (!slotContent) {
    return fallback;
  }
  return typeof slotContent === "function" ? slotContent(slotProps) : slotContent;
};
var InfiniteScroll = forwardRef(
  ({
    data,
    buffer = 0,
    as = "div",
    manual = false,
    manualAfter = 0,
    preserveUrl = false,
    reverse = false,
    autoScroll,
    children,
    startElement,
    endElement,
    itemsElement,
    previous,
    next,
    loading,
    onlyNext = false,
    onlyPrevious = false,
    ...props
  }, ref) => {
    const [startElementFromRef, setStartElementFromRef] = useState(null);
    const startElementRef = useCallback((node) => setStartElementFromRef(node), []);
    const [endElementFromRef, setEndElementFromRef] = useState(null);
    const endElementRef = useCallback((node) => setEndElementFromRef(node), []);
    const [itemsElementFromRef, setItemsElementFromRef] = useState(null);
    const itemsElementRef = useCallback((node) => setItemsElementFromRef(node), []);
    const [loadingPrevious, setLoadingPrevious] = useState(false);
    const [loadingNext, setLoadingNext] = useState(false);
    const [requestCount, setRequestCount] = useState(0);
    const [hasPreviousPage, setHasPreviousPage] = useState(false);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [resolvedStartElement, setResolvedStartElement] = useState(null);
    const [resolvedEndElement, setResolvedEndElement] = useState(null);
    const [resolvedItemsElement, setResolvedItemsElement] = useState(null);
    useEffect(() => {
      const element = startElement ? resolveHTMLElement(startElement, startElementFromRef) : startElementFromRef;
      setResolvedStartElement(element);
    }, [startElement, startElementFromRef]);
    useEffect(() => {
      const element = endElement ? resolveHTMLElement(endElement, endElementFromRef) : endElementFromRef;
      setResolvedEndElement(element);
    }, [endElement, endElementFromRef]);
    useEffect(() => {
      const element = itemsElement ? resolveHTMLElement(itemsElement, itemsElementFromRef) : itemsElementFromRef;
      setResolvedItemsElement(element);
    }, [itemsElement, itemsElementFromRef]);
    const scrollableParent = useMemo(() => getScrollableParent(resolvedItemsElement), [resolvedItemsElement]);
    const callbackPropsRef = useRef({
      buffer,
      onlyNext,
      onlyPrevious,
      reverse,
      preserveUrl
    });
    callbackPropsRef.current = {
      buffer,
      onlyNext,
      onlyPrevious,
      reverse,
      preserveUrl
    };
    const [infiniteScroll, setInfiniteScroll] = useState(null);
    const dataManager = useMemo(() => infiniteScroll?.dataManager, [infiniteScroll]);
    const elementManager = useMemo(() => infiniteScroll?.elementManager, [infiniteScroll]);
    const scrollToBottom = useCallback(() => {
      if (scrollableParent) {
        scrollableParent.scrollTo({
          top: scrollableParent.scrollHeight,
          behavior: "instant"
        });
      } else {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: "instant"
        });
      }
    }, [scrollableParent]);
    useEffect(() => {
      if (!resolvedItemsElement) {
        return;
      }
      function syncStateFromDataManager() {
        setRequestCount(infiniteScrollInstance.dataManager.getRequestCount());
        setHasPreviousPage(infiniteScrollInstance.dataManager.hasPrevious());
        setHasNextPage(infiniteScrollInstance.dataManager.hasNext());
      }
      const infiniteScrollInstance = useInfiniteScroll({
        // Data
        getPropName: () => data,
        inReverseMode: () => callbackPropsRef.current.reverse,
        shouldFetchNext: () => !callbackPropsRef.current.onlyPrevious,
        shouldFetchPrevious: () => !callbackPropsRef.current.onlyNext,
        shouldPreserveUrl: () => callbackPropsRef.current.preserveUrl,
        // Elements
        getTriggerMargin: () => callbackPropsRef.current.buffer,
        getStartElement: () => resolvedStartElement,
        getEndElement: () => resolvedEndElement,
        getItemsElement: () => resolvedItemsElement,
        getScrollableParent: () => scrollableParent,
        // Callbacks
        onBeforePreviousRequest: () => setLoadingPrevious(true),
        onBeforeNextRequest: () => setLoadingNext(true),
        onCompletePreviousRequest: () => {
          setLoadingPrevious(false);
          syncStateFromDataManager();
        },
        onCompleteNextRequest: () => {
          setLoadingNext(false);
          syncStateFromDataManager();
        },
        onDataReset: syncStateFromDataManager
      });
      setInfiniteScroll(infiniteScrollInstance);
      const { dataManager: dataManager2, elementManager: elementManager2 } = infiniteScrollInstance;
      syncStateFromDataManager();
      elementManager2.setupObservers();
      elementManager2.processServerLoadedElements(dataManager2.getLastLoadedPage());
      if (autoLoad) {
        elementManager2.enableTriggers();
      }
      return () => {
        infiniteScrollInstance.flush();
        setInfiniteScroll(null);
      };
    }, [data, resolvedItemsElement, resolvedStartElement, resolvedEndElement, scrollableParent]);
    const manualMode = useMemo(
      () => manual || manualAfter > 0 && requestCount >= manualAfter,
      [manual, manualAfter, requestCount]
    );
    const autoLoad = useMemo(() => !manualMode, [manualMode]);
    useEffect(() => {
      autoLoad ? elementManager?.enableTriggers() : elementManager?.disableTriggers();
    }, [autoLoad, onlyNext, onlyPrevious, resolvedStartElement, resolvedEndElement]);
    useEffect(() => {
      const shouldAutoScroll = autoScroll !== void 0 ? autoScroll : reverse;
      if (shouldAutoScroll) {
        scrollToBottom();
      }
    }, [scrollableParent]);
    useImperativeHandle(
      ref,
      () => ({
        fetchNext: dataManager?.fetchNext || (() => {
        }),
        fetchPrevious: dataManager?.fetchPrevious || (() => {
        }),
        hasPrevious: dataManager?.hasPrevious || (() => false),
        hasNext: dataManager?.hasNext || (() => false)
      }),
      [dataManager]
    );
    const headerAutoMode = autoLoad && !onlyNext;
    const footerAutoMode = autoLoad && !onlyPrevious;
    const sharedExposed = {
      loadingPrevious,
      loadingNext,
      hasPrevious: hasPreviousPage,
      hasNext: hasNextPage
    };
    const exposedPrevious = {
      loading: loadingPrevious,
      fetch: dataManager?.fetchPrevious ?? (() => {
      }),
      autoMode: headerAutoMode,
      manualMode: !headerAutoMode,
      hasMore: hasPreviousPage,
      ...sharedExposed
    };
    const exposedNext = {
      loading: loadingNext,
      fetch: dataManager?.fetchNext ?? (() => {
      }),
      autoMode: footerAutoMode,
      manualMode: !footerAutoMode,
      hasMore: hasNextPage,
      ...sharedExposed
    };
    const exposedSlot = {
      loading: loadingPrevious || loadingNext,
      loadingPrevious,
      loadingNext
    };
    const renderElements = [];
    if (!startElement) {
      renderElements.push(
        createElement(
          "div",
          { ref: startElementRef },
          // Render previous slot or fallback to loading indicator
          renderSlot(previous, exposedPrevious, loadingPrevious ? renderSlot(loading, exposedPrevious) : null)
        )
      );
    }
    renderElements.push(
      createElement(
        as,
        { ...props, ref: itemsElementRef },
        typeof children === "function" ? children(exposedSlot) : children
      )
    );
    if (!endElement) {
      renderElements.push(
        createElement(
          "div",
          { ref: endElementRef },
          // Render next slot or fallback to loading indicator
          renderSlot(next, exposedNext, loadingNext ? renderSlot(loading, exposedNext) : null)
        )
      );
    }
    return createElement(React2.Fragment, {}, ...reverse ? [...renderElements].reverse() : renderElements);
  }
);
InfiniteScroll.displayName = "InertiaInfiniteScroll";
var noop2 = () => void 0;
var Link = forwardRef(
  ({
    children,
    as = "a",
    data = {},
    href = "",
    method = "get",
    preserveScroll = false,
    preserveState = null,
    preserveUrl = false,
    replace = false,
    only = [],
    except = [],
    headers = {},
    queryStringArrayFormat = "brackets",
    async = false,
    onClick = noop2,
    onCancelToken = noop2,
    onBefore = noop2,
    onStart = noop2,
    onProgress = noop2,
    onFinish = noop2,
    onCancel = noop2,
    onSuccess = noop2,
    onError = noop2,
    onPrefetching = noop2,
    onPrefetched = noop2,
    prefetch = false,
    cacheFor = 0,
    cacheTags = [],
    viewTransition = false,
    ...props
  }, ref) => {
    const [inFlightCount, setInFlightCount] = useState(0);
    const hoverTimeout = useRef(void 0);
    const _method = useMemo(() => {
      return isUrlMethodPair(href) ? href.method : method.toLowerCase();
    }, [href, method]);
    const _as = useMemo(() => {
      if (typeof as !== "string" || as.toLowerCase() !== "a") {
        return as;
      }
      return _method !== "get" ? "button" : as.toLowerCase();
    }, [as, _method]);
    const mergeDataArray = useMemo(
      () => mergeDataIntoQueryString(_method, isUrlMethodPair(href) ? href.url : href, data, queryStringArrayFormat),
      [href, _method, data, queryStringArrayFormat]
    );
    const url = useMemo(() => mergeDataArray[0], [mergeDataArray]);
    const _data = useMemo(() => mergeDataArray[1], [mergeDataArray]);
    const baseParams = useMemo(
      () => ({
        data: _data,
        method: _method,
        preserveScroll,
        preserveState: preserveState ?? _method !== "get",
        preserveUrl,
        replace,
        only,
        except,
        headers,
        async
      }),
      [_data, _method, preserveScroll, preserveState, preserveUrl, replace, only, except, headers, async]
    );
    const visitParams = useMemo(
      () => ({
        ...baseParams,
        viewTransition,
        onCancelToken,
        onBefore,
        onStart(visit) {
          setInFlightCount((count) => count + 1);
          onStart(visit);
        },
        onProgress,
        onFinish(visit) {
          setInFlightCount((count) => count - 1);
          onFinish(visit);
        },
        onCancel,
        onSuccess,
        onError
      }),
      [
        baseParams,
        viewTransition,
        onCancelToken,
        onBefore,
        onStart,
        onProgress,
        onFinish,
        onCancel,
        onSuccess,
        onError
      ]
    );
    const prefetchModes = useMemo(
      () => {
        if (prefetch === true) {
          return ["hover"];
        }
        if (prefetch === false) {
          return [];
        }
        if (Array.isArray(prefetch)) {
          return prefetch;
        }
        return [prefetch];
      },
      Array.isArray(prefetch) ? prefetch : [prefetch]
    );
    const cacheForValue = useMemo(() => {
      if (cacheFor !== 0) {
        return cacheFor;
      }
      if (prefetchModes.length === 1 && prefetchModes[0] === "click") {
        return 0;
      }
      return config.get("prefetch.cacheFor");
    }, [cacheFor, prefetchModes]);
    const doPrefetch = useMemo(() => {
      return () => {
        router.prefetch(
          url,
          {
            ...baseParams,
            onPrefetching,
            onPrefetched
          },
          { cacheFor: cacheForValue, cacheTags }
        );
      };
    }, [url, baseParams, onPrefetching, onPrefetched, cacheForValue, cacheTags]);
    useEffect(() => {
      return () => {
        clearTimeout(hoverTimeout.current);
      };
    }, []);
    useEffect(() => {
      if (prefetchModes.includes("mount")) {
        setTimeout(() => doPrefetch());
      }
    }, prefetchModes);
    const regularEvents = {
      onClick: (event) => {
        onClick(event);
        if (shouldIntercept(event)) {
          event.preventDefault();
          router.visit(url, visitParams);
        }
      }
    };
    const prefetchHoverEvents = {
      onMouseEnter: () => {
        hoverTimeout.current = window.setTimeout(() => {
          doPrefetch();
        }, config.get("prefetch.hoverDelay"));
      },
      onMouseLeave: () => {
        clearTimeout(hoverTimeout.current);
      },
      onClick: regularEvents.onClick
    };
    const prefetchClickEvents = {
      onMouseDown: (event) => {
        if (shouldIntercept(event)) {
          event.preventDefault();
          doPrefetch();
        }
      },
      onKeyDown: (event) => {
        if (shouldNavigate(event)) {
          event.preventDefault();
          doPrefetch();
        }
      },
      onMouseUp: (event) => {
        if (shouldIntercept(event)) {
          event.preventDefault();
          router.visit(url, visitParams);
        }
      },
      onKeyUp: (event) => {
        if (shouldNavigate(event)) {
          event.preventDefault();
          router.visit(url, visitParams);
        }
      },
      onClick: (event) => {
        onClick(event);
        if (shouldIntercept(event)) {
          event.preventDefault();
        }
      }
    };
    const elProps = useMemo(() => {
      if (_as === "button") {
        return { type: "button" };
      }
      if (_as === "a" || typeof _as !== "string") {
        return { href: url };
      }
      return {};
    }, [_as, url]);
    return createElement(
      _as,
      {
        ...props,
        ...elProps,
        ref,
        ...(() => {
          if (prefetchModes.includes("hover")) {
            return prefetchHoverEvents;
          }
          if (prefetchModes.includes("click")) {
            return prefetchClickEvents;
          }
          return regularEvents;
        })(),
        "data-loading": inFlightCount > 0 ? "" : void 0
      },
      children
    );
  }
);
Link.displayName = "InertiaLink";
var Link_default = Link;
var router3 = router;
var config = config$1.extend();
const http = {
  request: (method, url, data = {}, options = {}) => {
    const setLoading = options.onLoading || (() => {
    });
    const isAdmin = url.startsWith("/admin");
    let payload = { ...data };
    let currentMethod = method.toUpperCase();
    if (["PUT", "PATCH", "DELETE"].includes(currentMethod) && hasFiles(data)) {
      payload._method = currentMethod;
      currentMethod = "POST";
    }
    router3.visit(url, {
      ...options,
      method: currentMethod.toLowerCase(),
      data: payload,
      forceFormData: hasFiles(data),
      preserveScroll: options.preserveScroll ?? true,
      preserveState: options.preserveState ?? true,
      // [개선] 요청 시작 시 로딩 시작
      onBefore: (visit) => {
        setLoading(true);
        options.onBefore?.(visit);
      },
      onSuccess: (page) => {
        options.onSuccess?.(page);
      },
      onError: (errors) => {
        if (isAdmin) console.error("Admin API Error:", errors);
        options.onError?.(errors);
      },
      // [개선] 성공/실패 상관없이 요청이 끝날 때 무조건 로딩 해제
      onFinish: (visit) => {
        setLoading(false);
        options.onFinish?.(visit);
      }
    });
  },
  // 래퍼 메서드들
  get: (url, data, options) => http.request("GET", url, data, options),
  post: (url, data, options) => http.request("POST", url, data, options),
  put: (url, data, options) => http.request("PUT", url, data, options),
  patch: (url, data, options) => http.request("PATCH", url, data, options),
  delete: (url, options = {}) => {
    const msg = options.confirmMsg || "정말 삭제하시겠습니까?";
    if (confirm(msg)) {
      http.request("DELETE", url, {}, options);
    }
  }
};
function hasFiles(data) {
  if (!data) return false;
  return Object.values(data).some((v) => {
    if (v instanceof File || v instanceof Blob) return true;
    if (Array.isArray(v))
      return v.some((f) => f instanceof File || f instanceof Blob);
    return false;
  });
}
function TopBar() {
  const { auth } = usePage().props;
  const user = auth?.user ?? null;
  const [query, setQuery] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  useEffect(() => {
    function onClickOutside(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);
  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    router3.visit("/search", { method: "get", data: { q: query.trim() }, preserveState: false });
  };
  const SearchForm = ({ className = "" }) => /* @__PURE__ */ jsx("form", { onSubmit: handleSearch, className, children: /* @__PURE__ */ jsxs("div", { className: "flex items-center bg-white/10 border border-white/20 rounded-lg overflow-hidden focus-within:border-sky-400 focus-within:bg-white/15 transition", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        value: query,
        onChange: (e) => setQuery(e.target.value),
        placeholder: "검색...",
        className: "flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-slate-400 outline-none min-w-0"
      }
    ),
    /* @__PURE__ */ jsx("button", { type: "submit", className: "px-3 py-2 text-slate-300 hover:text-white transition shrink-0", "aria-label": "검색", children: /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
      }
    ) }) })
  ] }) });
  return /* @__PURE__ */ jsx("div", { className: "relative bg-[#0d1b2a] border-b border-[#0a1520]", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "h-12 flex items-center", children: [
      /* @__PURE__ */ jsxs(Link_default, { href: "/", className: "shrink-0 flex items-center gap-0.5 select-none", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xl font-black tracking-tight text-sky-400", children: "KR" }),
        /* @__PURE__ */ jsx("span", { className: "text-xl font-black tracking-tight text-white", children: "LIVED" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-sm lg:max-w-md px-4 pointer-events-none", children: /* @__PURE__ */ jsx(SearchForm, { className: "w-full pointer-events-auto" }) }),
      /* @__PURE__ */ jsx("div", { className: "flex-1 md:hidden" }),
      /* @__PURE__ */ jsx("div", { className: "shrink-0 lg:hidden relative", ref: dropRef, children: user ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setDropOpen((v) => !v),
            className: "w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white text-sm font-bold hover:bg-sky-400 transition",
            children: user.name?.[0]?.toUpperCase() ?? "?"
          }
        ),
        dropOpen && /* @__PURE__ */ jsxs("div", { className: "absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50", children: [
          /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-b border-gray-100 bg-slate-50", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-800 truncate", children: user.name }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 truncate", children: user.email })
          ] }),
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: "/mypage",
              onClick: () => setDropOpen(false),
              className: "w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-blue-500 hover:bg-slate-50 transition block",
              children: "마이페이지"
            }
          ),
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: "/mypage?tab=scraps",
              onClick: () => setDropOpen(false),
              className: "w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-blue-500 hover:bg-slate-50 transition block",
              children: "내 스크랩"
            }
          ),
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: "/mypage?tab=inquiries",
              onClick: () => setDropOpen(false),
              className: "w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-blue-500 hover:bg-slate-50 transition block",
              children: "내 문의"
            }
          ),
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: "/mypage?tab=password",
              onClick: () => setDropOpen(false),
              className: "w-full text-left px-4 py-2.5 text-sm text-slate-600 hover:text-blue-500 hover:bg-slate-50 transition block",
              children: "비밀번호 변경"
            }
          ),
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: "/logout",
              method: "post",
              as: "button",
              onClick: () => setDropOpen(false),
              className: "w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:text-red-500 hover:bg-slate-50 transition",
              children: "로그아웃"
            }
          )
        ] })
      ] }) : /* @__PURE__ */ jsx(Link_default, { href: "/login", className: "text-sm font-medium text-white/80 hover:text-white transition", children: "로그인" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "md:hidden pb-2", children: /* @__PURE__ */ jsx(SearchForm, { className: "w-full" }) })
  ] }) });
}
function NavBar() {
  const { gnbBoards = [] } = usePage().props;
  const [open, setOpen] = useState(false);
  const fixedItems = [
    { label: "홈", href: "/" },
    { label: "인기글", href: "/popular" }
  ];
  const boardItems = gnbBoards.map((b) => ({
    label: b.board_name,
    href: `/board/${b.category}`
  }));
  const items = [...fixedItems, ...boardItems];
  return /* @__PURE__ */ jsx("nav", { className: "bg-[#1a3a5c] border-b border-[#0d2a45]", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center h-10", children: [
      /* @__PURE__ */ jsx("div", { className: "hidden md:flex items-center text-sm font-medium overflow-x-auto", children: items.map((item) => /* @__PURE__ */ jsx(
        Link_default,
        {
          href: item.href,
          className: "px-3 h-10 flex items-center text-white/90 hover:text-white hover:bg-white/15 transition whitespace-nowrap",
          children: item.label
        },
        item.label
      )) }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setOpen((v) => !v),
          className: "md:hidden flex items-center gap-2 text-sm text-white/90 hover:text-white transition",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }),
            /* @__PURE__ */ jsx("span", { children: "메뉴" })
          ]
        }
      )
    ] }),
    open && /* @__PURE__ */ jsx("div", { className: "md:hidden border-t border-white/20 py-2 pb-3 grid grid-cols-4 gap-1", children: items.map((item) => /* @__PURE__ */ jsx(
      Link_default,
      {
        href: item.href,
        className: "text-center text-xs text-white/90 hover:text-white py-2 rounded hover:bg-white/15 transition",
        onClick: () => setOpen(false),
        children: item.label
      },
      item.label
    )) })
  ] }) });
}
function Footer({ theme = "dark" }) {
  const dark = theme === "dark";
  return /* @__PURE__ */ jsx("footer", { className: `mt-auto text-sm ${dark ? "bg-[#0d1b2a] text-slate-500" : "bg-gray-100 text-slate-400 border-t border-gray-200"}`, children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2", children: [
    /* @__PURE__ */ jsxs("span", { className: "font-bold", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sky-500", children: "KR" }),
      /* @__PURE__ */ jsx("span", { className: dark ? "text-slate-300" : "text-slate-600", children: "LIVED" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsx(Link_default, { href: "/inquiry?type=SUPPORT", className: "hover:text-sky-400 transition", children: "1:1 문의" }),
      /* @__PURE__ */ jsx(Link_default, { href: "/inquiry?type=PARTNERSHIP", className: "hover:text-sky-400 transition", children: "제휴 문의" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " KRLived. All rights reserved."
      ] })
    ] })
  ] }) });
}
function LoginForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set2 = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    http.post("/login", form, {
      onLoading: setLoading,
      onError: (errs) => setErrors(errs)
    });
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-2.5 px-4 py-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "email",
          value: form.email,
          onChange: (e) => set2("email", e.target.value),
          placeholder: "이메일",
          className: "w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition",
          autoComplete: "email"
        }
      ),
      errors.email && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.email })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "password",
          value: form.password,
          onChange: (e) => set2("password", e.target.value),
          placeholder: "비밀번호",
          className: "w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition",
          autoComplete: "current-password"
        }
      ),
      errors.password && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.password })
    ] }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        disabled: loading,
        className: "w-full text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 rounded transition",
        children: loading ? "로그인 중..." : "로그인"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx(Link_default, { href: "/register", className: "text-xs text-blue-500 hover:text-blue-700 transition", children: "아직 계정이 없으신가요? 회원가입" }) })
  ] });
}
function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const set2 = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    http.post("/register", form, {
      onLoading: setLoading,
      onError: (errs) => setErrors(errs)
    });
  };
  return /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-2.5 px-4 py-3", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: form.name,
          onChange: (e) => set2("name", e.target.value),
          placeholder: "닉네임",
          className: "w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition",
          autoComplete: "username"
        }
      ),
      errors.name && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.name })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "email",
          value: form.email,
          onChange: (e) => set2("email", e.target.value),
          placeholder: "이메일",
          className: "w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition",
          autoComplete: "email"
        }
      ),
      errors.email && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.email })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "password",
          value: form.password,
          onChange: (e) => set2("password", e.target.value),
          placeholder: "비밀번호",
          className: "w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition",
          autoComplete: "new-password"
        }
      ),
      errors.password && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.password })
    ] }),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
      "input",
      {
        type: "password",
        value: form.password_confirmation,
        onChange: (e) => set2("password_confirmation", e.target.value),
        placeholder: "비밀번호 확인",
        className: "w-full text-sm border border-gray-200 rounded px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition",
        autoComplete: "new-password"
      }
    ) }),
    /* @__PURE__ */ jsx(
      "button",
      {
        type: "submit",
        disabled: loading,
        className: "w-full text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2 rounded transition",
        children: loading ? "가입 중..." : "무료 가입"
      }
    )
  ] });
}
function UserPanel({ user }) {
  return /* @__PURE__ */ jsxs("div", { className: "px-4 py-4 space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-blue-600", children: user.name?.[0] ?? "?" }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-800 truncate", children: user.name }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 truncate", children: user.email })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1.5 text-xs", children: [
      /* @__PURE__ */ jsx(Link_default, { href: "/mypage?tab=posts", className: "text-center py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition", children: "내 게시글" }),
      /* @__PURE__ */ jsx(Link_default, { href: "/mypage?tab=comments", className: "text-center py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition", children: "내 댓글" }),
      /* @__PURE__ */ jsx(Link_default, { href: "/mypage?tab=scraps", className: "text-center py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition", children: "내 스크랩" }),
      /* @__PURE__ */ jsx(Link_default, { href: "/mypage?tab=inquiries", className: "text-center py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition", children: "내 문의" }),
      /* @__PURE__ */ jsx(Link_default, { href: "/mypage?tab=password", className: "col-span-2 text-center py-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition", children: "비밀번호 변경" })
    ] }),
    /* @__PURE__ */ jsx(
      Link_default,
      {
        href: "/logout",
        method: "post",
        as: "button",
        className: "w-full text-sm text-slate-500 hover:text-red-500 border border-gray-200 rounded py-1.5 transition",
        children: "로그아웃"
      }
    )
  ] });
}
function AuthWidget() {
  const { auth } = usePage().props;
  const [tab, setTab] = useState("login");
  if (auth?.user) {
    return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "px-4 py-2.5 border-b border-gray-100 bg-slate-50", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-600 uppercase tracking-wide", children: "내 정보" }) }),
      /* @__PURE__ */ jsx(UserPanel, { user: auth.user })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex border-b border-gray-100", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setTab("login"),
          className: `flex-1 text-xs font-semibold py-2.5 transition ${tab === "login" ? "text-blue-600 border-b-2 border-blue-500 bg-white" : "text-slate-500 hover:text-slate-700 bg-slate-50"}`,
          children: "로그인"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setTab("register"),
          className: `flex-1 text-xs font-semibold py-2.5 transition ${tab === "register" ? "text-blue-600 border-b-2 border-blue-500 bg-white" : "text-slate-500 hover:text-slate-700 bg-slate-50"}`,
          children: "회원가입"
        }
      )
    ] }),
    tab === "login" ? /* @__PURE__ */ jsx(LoginForm, {}) : /* @__PURE__ */ jsx(RegisterForm, {})
  ] });
}
function ScriptBanner({ banner, className }) {
  const iframeRef = useRef(null);
  const [height, setHeight] = useState(250);
  const srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { width: 100%; overflow: hidden; }
/* AdSense ins 요소가 block으로 렌더링되도록 보장 */
ins.adsbygoogle { display: block !important; }
</style>
</head>
<body>
${banner.content ?? ""}
<script>
(function() {
  function report() {
    var h = Math.max(document.body.scrollHeight, document.body.offsetHeight,
                     document.documentElement.scrollHeight);
    if (h > 0) parent.postMessage({ type: 'bannerResize', id: ${banner.banner_id}, height: h }, '*');
  }
  window.addEventListener('load', report);
  /* AdSense는 비동기 렌더링이므로 여러 시점에 높이 확인 */
  setTimeout(report, 500);
  setTimeout(report, 1500);
  setTimeout(report, 3000);
})();
<\/script>
</body>
</html>`;
  useEffect(() => {
    function onMessage(e) {
      if (e.data?.type === "bannerResize" && e.data.id === banner.banner_id) {
        setHeight(e.data.height);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [banner.banner_id]);
  return /* @__PURE__ */ jsx(
    "iframe",
    {
      ref: iframeRef,
      srcDoc: srcdoc,
      className: `w-full block ${className ?? ""}`,
      style: { height: `${height}px`, border: "none" },
      sandbox: "allow-scripts allow-popups allow-popups-to-escape-sandbox",
      title: banner.title || "advertisement"
    }
  );
}
function BannerRenderer({ banner, className = "" }) {
  if (banner.banner_type === "IMAGE") {
    const img = /* @__PURE__ */ jsx(
      "img",
      {
        src: banner.image_url,
        alt: banner.title,
        className: `w-full h-auto block ${className}`
      }
    );
    return banner.link_url ? /* @__PURE__ */ jsx(
      "a",
      {
        href: banner.link_url,
        target: banner.is_new_tab ? "_blank" : "_self",
        rel: "noopener noreferrer",
        children: img
      }
    ) : img;
  }
  if (banner.banner_type === "SCRIPT") {
    return /* @__PURE__ */ jsx(ScriptBanner, { banner, className });
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      className,
      dangerouslySetInnerHTML: { __html: banner.content ?? "" }
    }
  );
}
function BannerSlot({ banners = [], position = "" }) {
  const safeBanners = Array.isArray(banners) ? banners : banners ? [banners] : [];
  if (safeBanners.length === 0) return null;
  if (position === "MAIN_BOARD_CATEGORY") {
    return /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-3 my-6", children: safeBanners.map((banner) => /* @__PURE__ */ jsx(
      "div",
      {
        className: "flex-1 overflow-hidden rounded border border-gray-200",
        style: { minWidth: "45%" },
        children: /* @__PURE__ */ jsx(BannerRenderer, { banner })
      },
      banner.banner_id
    )) });
  }
  return /* @__PURE__ */ jsx("div", { className: "space-y-4", children: safeBanners.map((banner) => /* @__PURE__ */ jsx(
    "div",
    {
      className: "w-full overflow-hidden rounded border border-gray-200",
      children: /* @__PURE__ */ jsx(BannerRenderer, { banner })
    },
    banner.banner_id
  )) });
}
function NoticeWidget() {
  const notices = [
    "서비스 이용 약관 안내",
    "개인정보처리방침 업데이트",
    "신규 게시판 오픈 안내"
  ];
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 bg-slate-50", children: /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-600 uppercase tracking-wide", children: "공지사항" }) }),
    /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-50", children: notices.map((n, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
      Link_default,
      {
        href: "/",
        className: "flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 transition group",
        children: [
          /* @__PURE__ */ jsx("span", { className: "shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-600 group-hover:text-blue-600 transition truncate", children: n })
        ]
      }
    ) }, i)) })
  ] });
}
function StatsWidget() {
  const { siteStats = {} } = usePage().props;
  const items = [
    {
      label: "오늘 게시글",
      value: siteStats.today_posts?.toLocaleString() ?? "—"
    },
    {
      label: "전체 회원",
      value: siteStats.total_members?.toLocaleString() ?? "—"
    }
    // { label: "현재 접속자", value: siteStats.online_users?.toLocaleString() ?? "—" },
  ];
  return /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-2", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-600 uppercase tracking-wide mb-3", children: "현황" }),
    items.map(({ label, value }) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex items-center justify-between text-xs",
        children: [
          /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: label }),
          /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-700", children: value })
        ]
      },
      label
    ))
  ] });
}
function Sidebar() {
  const { sideBanners1 = [] } = usePage().props;
  const { sideBanners2 = [] } = usePage().props;
  return /* @__PURE__ */ jsxs("aside", { className: "w-full lg:w-64 shrink-0 space-y-4 lg:self-start lg:sticky lg:top-20", children: [
    /* @__PURE__ */ jsx("div", { className: "hidden lg:block", children: /* @__PURE__ */ jsx(AuthWidget, {}) }),
    /* @__PURE__ */ jsx(BannerSlot, { banners: sideBanners1, position: "SIDE" }),
    /* @__PURE__ */ jsx(NoticeWidget, {}),
    /* @__PURE__ */ jsx(StatsWidget, {}),
    /* @__PURE__ */ jsx(BannerSlot, { banners: sideBanners2, position: "SIDE2" })
  ] });
}
function ServiceLayout({ children, sidebar = true }) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen flex flex-col bg-gray-100", children: [
    /* @__PURE__ */ jsxs("header", { className: "sticky top-0 z-40", children: [
      /* @__PURE__ */ jsx(TopBar, {}),
      /* @__PURE__ */ jsx(NavBar, {})
    ] }),
    /* @__PURE__ */ jsx("main", { className: "flex-1 max-w-6xl w-full mx-auto px-4 py-6", children: sidebar ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row gap-5", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1 min-w-0", children }),
      /* @__PURE__ */ jsx(Sidebar, {})
    ] }) : children }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
}
function Login() {
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    setProcessing(true);
    http.post("/login", values, {
      onError: (err) => setErrors(err),
      onFinish: () => setProcessing(false)
      // 성공/실패 상관없이 로딩 종료
    });
  };
  return /* @__PURE__ */ jsx(ServiceLayout, { children: /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto mt-10 p-6 bg-white shadow rounded-lg border border-gray-100", children: [
    /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-6 text-gray-800", children: "로그인" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700", children: "이메일" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            value: values.email,
            onChange: (e) => setValues({ ...values, email: e.target.value }),
            className: "w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
          }
        ),
        errors.email && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.email })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700", children: "비밀번호" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "password",
            value: values.password,
            onChange: (e) => setValues({
              ...values,
              password: e.target.value
            }),
            className: "w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          disabled: processing,
          className: "w-full py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition",
          children: processing ? "로그인 중..." : "로그인"
        }
      )
    ] })
  ] }) });
}
const __vite_glob_0_0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Login
}, Symbol.toStringTag, { value: "Module" }));
function Register() {
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: ""
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };
  const submit = (e) => {
    e.preventDefault();
    setProcessing(true);
    http.post("/register", values, {
      onError: (err) => setErrors(err),
      onFinish: () => setProcessing(false),
      onSuccess: () => console.log("가입 성공!")
    });
  };
  return /* @__PURE__ */ jsx(ServiceLayout, { children: /* @__PURE__ */ jsxs(
    "form",
    {
      onSubmit: submit,
      className: "max-w-md mx-auto p-6 bg-white shadow rounded-lg",
      children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold mb-6", children: "회원가입" }),
        /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium", children: "이름" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              name: "name",
              type: "text",
              value: values.name,
              onChange: handleChange,
              className: "w-full p-2 border rounded"
            }
          ),
          errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium", children: "이메일" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              name: "email",
              type: "email",
              value: values.email,
              onChange: handleChange,
              className: "w-full p-2 border rounded"
            }
          ),
          errors.email && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.email })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium", children: "비밀번호" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              name: "password",
              type: "password",
              value: values.password,
              onChange: handleChange,
              className: "w-full p-2 border rounded"
            }
          ),
          errors.password && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.password })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium", children: "비밀번호 확인" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              name: "password_confirmation",
              type: "password",
              value: values.password_confirmation,
              onChange: handleChange,
              className: "w-full p-2 border rounded"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            disabled: processing,
            className: "w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400",
            children: processing ? "처리 중..." : "가입하기"
          }
        )
      ]
    }
  ) });
}
const __vite_glob_0_1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Register
}, Symbol.toStringTag, { value: "Module" }));
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1e3);
  if (diff < 60) return "방금";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 86400 * 3) return `${Math.floor(diff / 86400)}일 전`;
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}`;
};
const fmtHits = (n) => {
  if (!n) return "0";
  if (n >= 1e4) return (n / 1e4).toFixed(1).replace(/\.0$/, "") + "만";
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
};
const truncate = (str, len = 38) => str && str.length > len ? str.slice(0, len) + "…" : str;
function BoardCard({ board }) {
  const posts = board.posts ?? [];
  const href = `/board/${board.category}`;
  return /* @__PURE__ */ jsxs("article", { className: "bg-white rounded border border-gray-200 shadow-sm flex flex-col overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-[#1a2942] px-3 py-2.5 gap-2", children: [
      /* @__PURE__ */ jsx(
        Link_default,
        {
          href,
          className: "text-sm font-bold text-white hover:text-sky-300 transition truncate",
          children: board.board_name
        }
      ),
      /* @__PURE__ */ jsx(
        Link_default,
        {
          href,
          className: "shrink-0 text-[11px] text-slate-400 hover:text-sky-400 transition whitespace-nowrap",
          children: "더보기 →"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("ul", { className: "flex-1 divide-y divide-gray-100", children: [
      posts.length === 0 && /* @__PURE__ */ jsx("li", { className: "px-3 py-5 text-center text-xs text-slate-400", children: "게시글이 없습니다." }),
      posts.map((post) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        Link_default,
        {
          href: `/post/${post.post_id}`,
          className: "flex items-center gap-2 px-3 py-2 hover:bg-sky-50 transition group",
          children: [
            post.is_notice ? /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 rounded px-1 leading-tight", children: "공지" }) : /* @__PURE__ */ jsx("span", { className: "shrink-0 w-1.5 h-1.5 rounded-full bg-slate-200 mt-px" }),
            /* @__PURE__ */ jsxs("span", { className: "flex-1 text-sm text-slate-800 group-hover:text-sky-700 leading-snug min-w-0 truncate", children: [
              truncate(post.title),
              post.comment_count > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-sky-500 font-bold text-xs", children: [
                "[",
                post.comment_count,
                "]"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "shrink-0 flex items-center gap-1.5 text-[11px] text-slate-400 whitespace-nowrap", children: [
              /* @__PURE__ */ jsx("span", { className: "hidden sm:block max-w-[56px] truncate", children: post.author }),
              /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "·" }),
              /* @__PURE__ */ jsx("span", { children: timeAgo(post.created_at) })
            ] })
          ]
        }
      ) }, post.post_id))
    ] })
  ] });
}
function Pagination({ curPage, lastPage, onPageChange }) {
  if (lastPage <= 1) return null;
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1).filter((p) => Math.abs(p - curPage) <= 4);
  return /* @__PURE__ */ jsxs("div", { className: "flex justify-center items-center gap-1 px-4 py-3 border-t border-gray-100", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => onPageChange(curPage - 1),
        disabled: curPage === 1,
        className: "px-2.5 py-1 text-xs rounded border border-gray-200 text-slate-500 disabled:opacity-30 hover:border-blue-400 hover:text-blue-500 transition",
        children: "‹"
      }
    ),
    pages.map((p) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => onPageChange(p),
        className: `px-2.5 py-1 text-xs rounded border transition ${p === curPage ? "border-blue-600 bg-blue-600 text-white font-semibold" : "border-gray-200 text-slate-600 hover:border-blue-400 hover:text-blue-500 bg-white"}`,
        children: p
      },
      p
    )),
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => onPageChange(curPage + 1),
        disabled: curPage === lastPage,
        className: "px-2.5 py-1 text-xs rounded border border-gray-200 text-slate-500 disabled:opacity-30 hover:border-blue-400 hover:text-blue-500 transition",
        children: "›"
      }
    )
  ] });
}
function BoardList({ board, list, seo = {} }) {
  const { auth } = usePage().props;
  const posts = list.data ?? [];
  const meta = list.meta ?? list;
  const lastPage = meta.last_page ?? 1;
  const curPage = meta.current_page ?? 1;
  function goPage(page) {
    router3.get(`/board/${board.category}`, { page }, { preserveScroll: true });
  }
  return /* @__PURE__ */ jsxs(ServiceLayout, { theme: "light", children: [
    /* @__PURE__ */ jsxs(Head_default, { children: [
      /* @__PURE__ */ jsx("title", { children: seo.title ?? board.board_name }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: seo.description ?? "" }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: seo.canonical ?? "" }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: seo.title ?? board.board_name }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: seo.description ?? "" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: seo.canonical ?? "" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx(Link_default, { href: "/", className: "text-sm text-slate-400 hover:text-blue-500 transition", children: "홈" }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-300 text-sm", children: "›" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: board.board_name })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-base font-bold text-slate-800", children: board.board_name }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400", children: [
            "전체 ",
            meta.total ?? 0,
            "건"
          ] }),
          auth?.user && /* @__PURE__ */ jsx(
            Link_default,
            {
              href: `/post/write?category=${board.category}`,
              className: "text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded px-2.5 py-1 transition",
              children: "글쓰기"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("ul", { className: "divide-y divide-gray-100", children: [
        posts.length === 0 && /* @__PURE__ */ jsx("li", { className: "px-4 py-10 text-center text-sm text-slate-400", children: "게시글이 없습니다." }),
        posts.map((post) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: `/post/${post.post_id}`,
            className: "flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition group",
            children: [
              post.is_notice ? /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 leading-tight", children: "공지" }) : /* @__PURE__ */ jsx("span", { className: "shrink-0 w-1.5 h-1.5 rounded-full bg-slate-200" }),
              /* @__PURE__ */ jsxs("span", { className: "flex-1 text-sm text-slate-700 group-hover:text-blue-600 transition leading-snug truncate min-w-0", children: [
                post.title,
                post.has_image && /* @__PURE__ */ jsx("i", { className: "fa-regular fa-image ml-1 text-slate-400 text-[11px]" }),
                post.comment_count > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-blue-400 font-semibold text-xs", children: [
                  "[",
                  post.comment_count,
                  "]"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "shrink-0 flex items-center gap-2 text-[11px] text-slate-400 whitespace-nowrap", children: [
                /* @__PURE__ */ jsx("span", { className: "hidden sm:block max-w-[60px] truncate", children: post.author }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:block text-slate-300", children: "·" }),
                /* @__PURE__ */ jsxs("span", { className: "hidden sm:flex items-center gap-1", children: [
                  /* @__PURE__ */ jsx("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }) }),
                  fmtHits(post.hits)
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-slate-300 hidden sm:block", children: "·" }),
                /* @__PURE__ */ jsx("span", { children: timeAgo(post.created_at) })
              ] })
            ]
          }
        ) }, post.post_id))
      ] }),
      /* @__PURE__ */ jsx(Pagination, { curPage, lastPage, onPageChange: goPage })
    ] })
  ] });
}
const __vite_glob_0_2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: BoardList
}, Symbol.toStringTag, { value: "Module" }));
function PopularList({ list }) {
  const posts = list?.data ?? [];
  const meta = list?.meta ?? list ?? {};
  const lastPage = meta.last_page ?? 1;
  const curPage = meta.current_page ?? 1;
  const total = meta.total ?? 0;
  function goPage(page) {
    router3.get("/popular", { page }, { preserveScroll: true });
  }
  return /* @__PURE__ */ jsxs(ServiceLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx(Link_default, { href: "/", className: "text-sm text-slate-400 hover:text-blue-500 transition", children: "홈" }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-300 text-sm", children: "›" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: "인기글" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-base font-bold text-slate-800 flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-orange-500", children: "🔥" }),
          " 인기글",
          /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-slate-400", children: "최근 7일 기준" })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400", children: [
          "전체 ",
          total,
          "건"
        ] })
      ] }),
      posts.length === 0 && /* @__PURE__ */ jsx("div", { className: "px-4 py-16 text-center text-sm text-slate-400", children: "인기글이 없습니다." }),
      /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100", children: posts.map((post, i) => {
        const rank = (curPage - 1) * (meta.per_page ?? 30) + i + 1;
        return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: `/post/${post.post_id}`,
            className: "flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition group",
            children: [
              /* @__PURE__ */ jsx("span", { className: `shrink-0 w-6 text-center text-xs font-bold ${rank === 1 ? "text-orange-500" : rank === 2 ? "text-slate-500" : rank === 3 ? "text-amber-600" : "text-slate-300"}`, children: rank }),
              /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap", children: post.board_name }),
              /* @__PURE__ */ jsxs("span", { className: "flex-1 text-sm text-slate-700 group-hover:text-orange-600 transition leading-snug truncate min-w-0", children: [
                post.title,
                post.has_image && /* @__PURE__ */ jsx("i", { className: "fa-regular fa-image ml-1 text-slate-400 text-[11px]" }),
                post.comment_count > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-blue-400 font-semibold text-xs", children: [
                  "[",
                  post.comment_count,
                  "]"
                ] })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "shrink-0 flex items-center gap-2 text-[11px] text-slate-400 whitespace-nowrap", children: [
                /* @__PURE__ */ jsx("span", { className: "hidden sm:block max-w-[60px] truncate", children: post.author }),
                /* @__PURE__ */ jsx("span", { className: "hidden sm:block text-slate-300", children: "·" }),
                /* @__PURE__ */ jsxs("span", { className: "hidden sm:flex items-center gap-1 text-orange-400 font-medium", children: [
                  /* @__PURE__ */ jsx("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }) }),
                  fmtHits(post.hits)
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-slate-300 hidden sm:block", children: "·" }),
                /* @__PURE__ */ jsx("span", { children: timeAgo(post.created_at) })
              ] })
            ]
          }
        ) }, post.post_id);
      }) }),
      /* @__PURE__ */ jsx(Pagination, { curPage, lastPage, onPageChange: goPage })
    ] })
  ] });
}
const __vite_glob_0_3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: PopularList
}, Symbol.toStringTag, { value: "Module" }));
const REASONS = [
  { value: "SPAM", label: "스팸/도배" },
  { value: "OBSCENE", label: "음란/불건전" },
  { value: "ILLEGAL", label: "불법 정보" },
  { value: "ETC", label: "기타" }
];
function ReportModal({ postId, onClose }) {
  const [reason, setReason] = useState("SPAM");
  const [detail, setDetail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post(`/post/${postId}/report`, { reason, detail: detail || null });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message ?? "신고 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4", onClick: onClose, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "bg-white rounded-xl shadow-2xl w-full max-w-sm",
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-5 py-3.5 border-b border-gray-100", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 text-sm", children: "게시글 신고" }),
          /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600 transition", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })
        ] }),
        done ? /* @__PURE__ */ jsxs("div", { className: "px-5 py-8 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3", children: /* @__PURE__ */ jsx("svg", { className: "w-6 h-6 text-green-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.5, d: "M5 13l4 4L19 7" }) }) }),
          /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-700 mb-1", children: "신고가 접수되었습니다" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-4", children: "검토 후 조치하겠습니다." }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClose,
              className: "px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition",
              children: "확인"
            }
          )
        ] }) : /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "px-5 py-4 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-slate-600 mb-2", children: "신고 사유" }),
            /* @__PURE__ */ jsx("div", { className: "space-y-2", children: REASONS.map((r) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2.5 cursor-pointer", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "radio",
                  name: "reason",
                  value: r.value,
                  checked: reason === r.value,
                  onChange: () => setReason(r.value),
                  className: "accent-blue-600"
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-700", children: r.label })
            ] }, r.value)) })
          ] }),
          reason === "ETC" && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-slate-600 mb-1", children: "상세 내용" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: detail,
                onChange: (e) => setDetail(e.target.value),
                rows: 3,
                maxLength: 500,
                placeholder: "신고 내용을 입력해주세요.",
                className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition resize-none"
              }
            )
          ] }),
          error && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500", children: error }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: onClose,
                className: "px-4 py-1.5 border border-gray-200 hover:bg-gray-50 text-slate-600 text-sm rounded-lg transition",
                children: "취소"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: loading,
                className: "px-4 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition",
                children: loading ? "신고 중..." : "신고하기"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
}
function CommentForm({ postId, parentId = null, onCancel = null, autoFocus = false }) {
  const { data, setData, post, processing, reset, errors } = useForm({
    content: "",
    parent_id: parentId
  });
  function submit(e) {
    e.preventDefault();
    post(`/post/${postId}/comments`, {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onCancel?.();
      }
    });
  }
  return /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "mt-2", children: [
    /* @__PURE__ */ jsx(
      "textarea",
      {
        value: data.content,
        onChange: (e) => setData("content", e.target.value),
        rows: 2,
        autoFocus,
        placeholder: parentId ? "대댓글을 입력하세요" : "댓글을 입력하세요",
        className: "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
      }
    ),
    errors.content && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.content }),
    errors.parent_id && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500 mt-1", children: errors.parent_id }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 mt-1.5", children: [
      onCancel && /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: onCancel,
          className: "px-3 py-1 text-xs text-slate-500 hover:text-slate-700 transition",
          children: "취소"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: processing || !data.content.trim(),
          className: "px-4 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-40 transition",
          children: processing ? "등록 중..." : "등록"
        }
      )
    ] })
  ] });
}
function CommentItem({ comment, postId, authUser, maxDepth, replies = [], allComments, depth = 1 }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { delete: destroy, processing } = useForm();
  const isOwner = authUser && authUser.id === comment.user_id;
  const canReply = authUser && comment.depth < maxDepth;
  const isNested = depth > 1;
  function handleDelete() {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    destroy(`/comment/${comment.comment_id}`, { preserveScroll: true });
  }
  return /* @__PURE__ */ jsxs("li", { children: [
    /* @__PURE__ */ jsxs("div", { className: `flex gap-3 py-3 ${isNested ? "pl-4" : ""}`, children: [
      isNested && /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex flex-col items-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-0.5 h-3 bg-blue-200 rounded-full mb-1" }),
        /* @__PURE__ */ jsx("div", { className: "shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[11px] font-bold text-blue-500 uppercase", children: comment.author?.charAt(0) ?? "?" })
      ] }),
      !isNested && /* @__PURE__ */ jsx("div", { className: "shrink-0 w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 uppercase", children: comment.author?.charAt(0) ?? "?" }),
      /* @__PURE__ */ jsxs("div", { className: `flex-1 min-w-0 ${isNested ? "bg-slate-50 rounded-xl px-3 py-2 border border-slate-100" : ""}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          isNested && /* @__PURE__ */ jsx("span", { className: "text-blue-400 text-xs", children: "↳" }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: comment.author }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: timeAgo(comment.created_at) }),
          isNested && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-blue-400 bg-blue-50 border border-blue-100 rounded px-1 leading-tight", children: "답글" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-700 whitespace-pre-wrap wrap-break-word leading-relaxed", children: comment.content }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mt-1.5", children: [
          canReply && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowReplyForm((v) => !v),
              className: "text-xs text-slate-400 hover:text-blue-500 transition",
              children: "💬 답글"
            }
          ),
          isOwner && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleDelete,
              disabled: processing,
              className: "text-xs text-slate-400 hover:text-red-500 transition",
              children: "삭제"
            }
          )
        ] }),
        showReplyForm && authUser && /* @__PURE__ */ jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsx(
          CommentForm,
          {
            postId,
            parentId: comment.comment_id,
            onCancel: () => setShowReplyForm(false),
            autoFocus: true
          }
        ) })
      ] })
    ] }),
    replies.length > 0 && /* @__PURE__ */ jsx("ul", { className: "border-l-2 border-blue-200 ml-10 pl-3 mb-1", children: replies.map((reply) => /* @__PURE__ */ jsx(
      CommentItem,
      {
        comment: reply,
        postId,
        authUser,
        maxDepth,
        replies: allComments.filter((c) => c.parent_id === reply.comment_id),
        allComments,
        depth: depth + 1
      },
      reply.comment_id
    )) })
  ] });
}
function ShareButton({ title }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);
  function copyUrl() {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setOpen(false);
        }, 1500);
      });
    } else {
      const el = document.createElement("textarea");
      el.value = url;
      el.style.cssText = "position:fixed;top:-9999px;left:-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
        setOpen(false);
      }, 1500);
    }
  }
  const encodedUrl = encodeURIComponent(typeof window !== "undefined" ? window.location.href : "");
  const encodedTitle = encodeURIComponent(title ?? "");
  return /* @__PURE__ */ jsxs("div", { className: "relative", ref, children: [
    /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => setOpen((v) => !v),
        className: "flex items-center gap-1 text-xs text-slate-400 hover:text-blue-500 transition",
        title: "공유",
        children: [
          /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
            "path",
            {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 2,
              d: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            }
          ) }),
          "공유"
        ]
      }
    ),
    open && /* @__PURE__ */ jsxs("div", { className: "absolute bottom-full right-0 mb-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: copyUrl,
          className: "w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition",
          children: [
            copied ? /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 text-green-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) : /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" }) }),
            copied ? "복사됨!" : "URL 복사"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
          target: "_blank",
          rel: "noreferrer",
          className: "w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.261 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" }) }),
            "X (Twitter)"
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          target: "_blank",
          rel: "noreferrer",
          className: "w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition",
          children: [
            /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 text-blue-600", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) }),
            "Facebook"
          ]
        }
      )
    ] })
  ] });
}
function ScrapButton({ postId, initialScrapped, initialCount, authUser }) {
  const [scrapped, setScrapped] = useState(initialScrapped ?? false);
  const [count, setCount] = useState(initialCount ?? 0);
  const [loading, setLoading] = useState(false);
  async function handleToggle() {
    if (!authUser) {
      window.location.href = "/login";
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post(`/post/${postId}/scrap`);
      setScrapped(res.data.scrapped);
      setCount(res.data.count);
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: handleToggle,
      disabled: loading,
      title: scrapped ? "스크랩 취소" : "스크랩",
      className: `flex items-center gap-1 text-xs transition disabled:opacity-50 ${scrapped ? "text-amber-500 hover:text-amber-600" : "text-slate-400 hover:text-amber-500"}`,
      children: [
        /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: scrapped ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          }
        ) }),
        "스크랩",
        count > 0 && /* @__PURE__ */ jsx("span", { className: "font-mono ml-0.5", children: count })
      ]
    }
  );
}
function LikeBar({ postId, initialLike, initialDislike, initialUserType, useLike, useDislike, authUser }) {
  const [likeCount, setLikeCount] = useState(initialLike ?? 0);
  const [dislikeCount, setDislikeCount] = useState(initialDislike ?? 0);
  const [userType, setUserType] = useState(initialUserType ?? null);
  const [loading, setLoading] = useState(false);
  if (!useLike && !useDislike) return null;
  async function handleToggle(type) {
    if (!authUser) {
      window.location.href = "/login";
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await axios.post(`/post/${postId}/like`, { type });
      setLikeCount(res.data.like_count);
      setDislikeCount(res.data.dislike_count);
      setUserType(res.data.user_type);
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3 py-5 border-t border-gray-100", children: [
    useLike && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => handleToggle("LIKE"),
        disabled: loading,
        className: `flex items-center gap-2 px-5 py-2 rounded-full border-2 text-sm font-semibold transition disabled:opacity-50 ${userType === "LIKE" ? "border-blue-500 bg-blue-500 text-white" : "border-gray-200 text-slate-500 hover:border-blue-400 hover:text-blue-500"}`,
        children: [
          /* @__PURE__ */ jsx("svg", { className: "w-4 h-4", fill: userType === "LIKE" ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" }) }),
          "좋아요 ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: likeCount })
        ]
      }
    ),
    useDislike && /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: () => handleToggle("DISLIKE"),
        disabled: loading,
        className: `flex items-center gap-2 px-5 py-2 rounded-full border-2 text-sm font-semibold transition disabled:opacity-50 ${userType === "DISLIKE" ? "border-rose-500 bg-rose-500 text-white" : "border-gray-200 text-slate-500 hover:border-rose-400 hover:text-rose-500"}`,
        children: [
          /* @__PURE__ */ jsx("svg", { className: "w-4 h-4 rotate-180", fill: userType === "DISLIKE" ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" }) }),
          "싫어요 ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: dislikeCount })
        ]
      }
    )
  ] });
}
function PostDetail({ post, isOwner = false, comments = [], maxDepth = 2, boardOptions = {}, userLikeType = null, isScrapped = false, scrapCount = 0, prevPost = null, nextPost = null, seo = {} }) {
  const { auth } = usePage().props;
  const authUser = auth?.user ?? null;
  const [showReport, setShowReport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { delete: destroy, processing: deleting } = useForm();
  const topLevel = comments.filter((c) => !c.parent_id);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: seo.description ?? "",
    author: { "@type": "Person", name: post.author },
    datePublished: seo.publishedAt ?? post.created_at,
    url: seo.canonical ?? "",
    ...seo.ogImage ? { image: seo.ogImage } : {}
  };
  return /* @__PURE__ */ jsxs(ServiceLayout, { theme: "light", children: [
    /* @__PURE__ */ jsxs(Head_default, { children: [
      /* @__PURE__ */ jsx("title", { children: seo.title ?? post.title }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: seo.description ?? "" }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: seo.canonical ?? "" }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "article" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: seo.title ?? post.title }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: seo.description ?? "" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: seo.canonical ?? "" }),
      seo.ogImage && /* @__PURE__ */ jsx("meta", { property: "og:image", content: seo.ogImage }),
      seo.publishedAt && /* @__PURE__ */ jsx("meta", { property: "article:published_time", content: seo.publishedAt }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:title", content: seo.title ?? post.title }),
      /* @__PURE__ */ jsx("meta", { name: "twitter:description", content: seo.description ?? "" }),
      seo.ogImage && /* @__PURE__ */ jsx("meta", { name: "twitter:image", content: seo.ogImage }),
      /* @__PURE__ */ jsx("script", { type: "application/ld+json", children: JSON.stringify(jsonLd) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4 text-sm text-slate-400", children: [
      /* @__PURE__ */ jsx(Link_default, { href: "/", className: "hover:text-blue-500 transition", children: "홈" }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "›" }),
      /* @__PURE__ */ jsx(Link_default, { href: `/board/${post.category}`, className: "hover:text-blue-500 transition", children: post.board_name }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "›" }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-600 truncate max-w-xs", children: post.title })
    ] }),
    /* @__PURE__ */ jsxs("article", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-5 py-4 border-b border-gray-100", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          post.is_notice && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-bold text-white bg-red-500 rounded px-1.5 py-0.5 leading-tight", children: "공지" }),
          post.board_name && /* @__PURE__ */ jsx(
            Link_default,
            {
              href: `/board/${post.category}`,
              className: "text-[10px] font-medium text-blue-500 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 leading-tight hover:bg-blue-100 transition",
              children: post.board_name
            }
          )
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold text-slate-800 leading-snug mb-3", children: post.title }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-xs text-slate-400", children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium text-slate-600", children: post.author }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "·" }),
          /* @__PURE__ */ jsx("span", { children: timeAgo(post.created_at) }),
          /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "·" }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }) }),
            fmtHits(post.hits)
          ] }),
          comments.length > 0 && /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsx("span", { className: "text-slate-300", children: "·" }),
            /* @__PURE__ */ jsxs("span", { children: [
              "댓글 ",
              comments.length
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "px-5 py-6 prose prose-sm max-w-none text-slate-700 leading-relaxed post-content",
          dangerouslySetInnerHTML: { __html: post.content }
        }
      ),
      /* @__PURE__ */ jsx(
        LikeBar,
        {
          postId: post.post_id,
          initialLike: post.like_count,
          initialDislike: post.dislike_count,
          initialUserType: userLikeType,
          useLike: boardOptions.use_like ?? true,
          useDislike: boardOptions.use_dislike ?? false,
          authUser
        }
      ),
      (prevPost || nextPost) && /* @__PURE__ */ jsxs("div", { className: "border-t border-gray-100 text-sm", children: [
        nextPost && /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: `/post/${nextPost.post_id}`,
            className: "flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition border-b border-gray-100 group",
            children: [
              /* @__PURE__ */ jsxs("span", { className: "shrink-0 flex items-center gap-1 text-xs text-slate-400 w-14", children: [
                /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 15l7-7 7 7" }) }),
                "다음글"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-slate-700 truncate group-hover:text-blue-500 transition", children: nextPost.title })
            ]
          }
        ),
        prevPost && /* @__PURE__ */ jsxs(
          Link_default,
          {
            href: `/post/${prevPost.post_id}`,
            className: "flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition group",
            children: [
              /* @__PURE__ */ jsxs("span", { className: "shrink-0 flex items-center gap-1 text-xs text-slate-400 w-14", children: [
                /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) }),
                "이전글"
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-slate-700 truncate group-hover:text-blue-500 transition", children: prevPost.title })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-5 py-3 border-t border-gray-100 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx(Link_default, { href: `/board/${post.category}`, className: "text-sm text-slate-500 hover:text-blue-500 transition", children: "← 목록" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsx(
            ScrapButton,
            {
              postId: post.post_id,
              initialScrapped: isScrapped,
              initialCount: scrapCount,
              authUser
            }
          ),
          /* @__PURE__ */ jsx(ShareButton, { title: post.title }),
          !isOwner && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowReport(true),
              className: "flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition",
              children: [
                /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H13l-1-1H5a2 2 0 00-2 2zm9-13.5V9" }) }),
                "신고"
              ]
            }
          ),
          isOwner && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => setShowDeleteConfirm(true),
              className: "flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition",
              children: [
                /* @__PURE__ */ jsx("svg", { className: "w-3.5 h-3.5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" }) }),
                "삭제"
              ]
            }
          )
        ] })
      ] })
    ] }),
    showReport && /* @__PURE__ */ jsx(ReportModal, { postId: post.post_id, onClose: () => setShowReport(false) }),
    showDeleteConfirm && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40", children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-xl shadow-xl p-6 w-80 mx-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-slate-800 mb-2", children: "게시글 삭제" }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 mb-5", children: [
        "게시글을 삭제하면 첨부 파일과 함께 복구할 수 없습니다.",
        /* @__PURE__ */ jsx("br", {}),
        "삭제하시겠습니까?"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-end", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowDeleteConfirm(false),
            disabled: deleting,
            className: "px-4 py-2 text-sm text-slate-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50",
            children: "취소"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => destroy(`/post/${post.post_id}`, {
              onSuccess: () => setShowDeleteConfirm(false)
            }),
            disabled: deleting,
            className: "px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition disabled:opacity-50",
            children: deleting ? "삭제 중..." : "삭제"
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "mt-4 bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-sm font-bold text-slate-700 mb-1", children: [
        "댓글 ",
        /* @__PURE__ */ jsx("span", { className: "text-blue-500", children: comments.length })
      ] }),
      topLevel.length > 0 ? /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100", children: topLevel.map((c) => /* @__PURE__ */ jsx(
        CommentItem,
        {
          comment: c,
          postId: post.post_id,
          authUser,
          maxDepth,
          replies: comments.filter((r) => r.parent_id === c.comment_id),
          allComments: comments
        },
        c.comment_id
      )) }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 py-6 text-center", children: "첫 댓글을 남겨보세요." }),
      /* @__PURE__ */ jsx("div", { className: "mt-4 border-t border-gray-100 pt-4", children: authUser ? /* @__PURE__ */ jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "shrink-0 w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-500 uppercase", children: authUser.name?.charAt(0) ?? "?" }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mb-1", children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-slate-700", children: authUser.name }),
            "으로 댓글 작성"
          ] }),
          /* @__PURE__ */ jsx(CommentForm, { postId: post.post_id })
        ] })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-3", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-2", children: "댓글을 작성하려면 로그인이 필요합니다." }),
        /* @__PURE__ */ jsx(Link_default, { href: "/login", className: "text-sm text-blue-500 hover:underline font-medium", children: "로그인하기" })
      ] }) })
    ] })
  ] });
}
const __vite_glob_0_4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: PostDetail
}, Symbol.toStringTag, { value: "Module" }));
const client = axios.create({
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json"
  }
});
const ajax = {
  /**
   * 핵심 요청 함수
   */
  async request(url, method = "GET", options = {}) {
    const {
      data = null,
      params = null,
      // GET 파라미터 전용
      onLoading = null,
      // 로딩 상태 제어 (true/false)
      onSuccess = null,
      onError = null,
      onComplete = null
    } = options;
    if (onLoading) onLoading(true);
    try {
      const response = await client({
        url,
        method: method.toUpperCase(),
        data,
        params,
        // FormData일 경우 Axios가 Content-Type을 알아서 설정함
        headers: data instanceof FormData ? {} : { "Content-Type": "application/json" }
      });
      if (onSuccess) onSuccess(response.data);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || error.message;
      if (onError) onError(errorData);
      else console.error("AJAX Error:", errorData);
      throw error;
    } finally {
      if (onLoading) onLoading(false);
      if (onComplete) onComplete();
    }
  },
  // 래퍼 메서드들
  get: (url, params, options = {}) => ajax.request(url, "GET", { ...options, params }),
  post: (url, data, options = {}) => ajax.request(url, "POST", { ...options, data }),
  put: (url, data, options = {}) => ajax.request(url, "PUT", { ...options, data }),
  patch: (url, data, options = {}) => ajax.request(url, "PATCH", { ...options, data }),
  delete: (url, options = {}) => ajax.request(url, "DELETE", options),
  // 파일 업로드 전용
  upload: (url, formData, options = {}) => ajax.post(url, formData, options)
};
const compressImage = (file, maxWidth = 1200, quality = 0.8) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = (e) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round(height * maxWidth / width);
        width = maxWidth;
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("압축 실패"));
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }));
        },
        "image/jpeg",
        quality
      );
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
});
function PostWrite({ boards = [], category = null }) {
  const { props } = usePage();
  document.querySelector('meta[name="csrf-token"]')?.content ?? "";
  const [form, setForm] = useState({
    post_category: category ?? (boards[0]?.category ?? ""),
    title: "",
    content: ""
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const quillRef = useRef(null);
  const uploadedFileIds = useRef([]);
  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "image"],
        ["clean"]
      ],
      handlers: {
        image: () => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/jpeg,image/png,image/gif,image/webp";
          input.click();
          input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
              const compressed = await compressImage(file);
              const fd = new FormData();
              fd.append("file", compressed);
              const res = await ajax.upload("/files/upload", fd);
              if (res.success) {
                if (res.data.file_id) uploadedFileIds.current.push(res.data.file_id);
                const editor = quillRef.current?.getEditor();
                if (editor) {
                  const range = editor.getSelection(true);
                  editor.insertEmbed(range.index, "image", res.data.file_url);
                  editor.setSelection(range.index + 1);
                }
              }
            } catch (err) {
              console.error("이미지 업로드 실패:", err);
              alert("이미지 업로드에 실패했습니다.");
            }
          };
        }
      }
    }
  }), []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};
    if (!form.post_category) newErrors.post_category = "게시판을 선택해주세요.";
    if (!form.title.trim()) newErrors.title = "제목을 입력해주세요.";
    if (!form.content || form.content === "<p><br></p>") newErrors.content = "내용을 입력해주세요.";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setSubmitting(true);
    router3.post("/post/write", {
      post_category: form.post_category,
      title: form.title,
      content: form.content,
      uploaded_file_ids: uploadedFileIds.current
    }, {
      onError: (errs) => {
        setErrors(errs);
        setSubmitting(false);
      },
      onFinish: () => setSubmitting(false)
    });
  };
  return /* @__PURE__ */ jsxs(ServiceLayout, { theme: "light", children: [
    /* @__PURE__ */ jsx(Head_default, { children: /* @__PURE__ */ jsx("title", { children: "글쓰기" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx(Link_default, { href: "/", className: "text-sm text-slate-400 hover:text-blue-500 transition", children: "홈" }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-300 text-sm", children: "›" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: "글쓰기" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "px-4 py-3 border-b border-gray-100 bg-gray-50", children: /* @__PURE__ */ jsx("h1", { className: "text-base font-bold text-slate-800", children: "글쓰기" }) }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "p-4 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-600 mb-1", children: "게시판" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: form.post_category,
              onChange: (e) => setForm((prev) => ({ ...prev, post_category: e.target.value })),
              className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "", children: "선택하세요" }),
                boards.map((b) => /* @__PURE__ */ jsx("option", { value: b.category, children: b.board_name }, b.category))
              ]
            }
          ),
          errors.post_category && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.post_category })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-600 mb-1", children: "제목" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.title,
              onChange: (e) => setForm((prev) => ({ ...prev, title: e.target.value })),
              placeholder: "제목을 입력하세요",
              maxLength: 255,
              className: "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            }
          ),
          errors.title && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.title })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-600 mb-1", children: [
            "내용",
            /* @__PURE__ */ jsx("span", { className: "ml-2 text-xs text-slate-400 font-normal", children: "이미지 삽입 시 자동 압축 후 업로드됩니다" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "border border-gray-300 rounded-lg overflow-hidden", children: /* @__PURE__ */ jsx(
            ReactQuill,
            {
              ref: quillRef,
              value: form.content,
              onChange: (value) => setForm((prev) => ({ ...prev, content: value })),
              modules: quillModules,
              style: { height: "320px", marginBottom: "50px" }
            }
          ) }),
          errors.content && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.content })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-3 pt-2", children: [
          /* @__PURE__ */ jsx(
            Link_default,
            {
              href: form.post_category ? `/board/${form.post_category}` : "/",
              className: "px-4 py-2 text-sm border border-gray-300 rounded-lg text-slate-600 hover:bg-gray-50 transition",
              children: "취소"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: submitting,
              className: "px-5 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition",
              children: submitting ? "등록 중..." : "등록"
            }
          )
        ] })
      ] })
    ] })
  ] });
}
const __vite_glob_0_5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: PostWrite
}, Symbol.toStringTag, { value: "Module" }));
const ERROR_INFO = {
  404: {
    title: "페이지를 찾을 수 없습니다",
    description: "요청하신 페이지가 삭제되었거나 주소가 변경되었습니다.",
    icon: /* @__PURE__ */ jsx("svg", { className: "w-16 h-16 text-slate-300", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 1.5,
        d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      }
    ) })
  },
  403: {
    title: "접근 권한이 없습니다",
    description: "이 페이지를 볼 수 있는 권한이 없습니다.",
    icon: /* @__PURE__ */ jsx("svg", { className: "w-16 h-16 text-slate-300", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 1.5,
        d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      }
    ) })
  },
  500: {
    title: "서버 오류가 발생했습니다",
    description: "일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요.",
    icon: /* @__PURE__ */ jsx("svg", { className: "w-16 h-16 text-slate-300", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx(
      "path",
      {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 1.5,
        d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      }
    ) })
  },
  503: {
    title: "서비스 점검 중입니다",
    description: "더 나은 서비스를 위해 점검 중입니다. 잠시 후 다시 방문해주세요.",
    icon: /* @__PURE__ */ jsxs("svg", { className: "w-16 h-16 text-slate-300", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
      /* @__PURE__ */ jsx(
        "path",
        {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 1.5,
          d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        }
      ),
      /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
    ] })
  }
};
function ErrorPage({ status = 404 }) {
  const info = ERROR_INFO[status] ?? ERROR_INFO[404];
  return /* @__PURE__ */ jsxs(ServiceLayout, { sidebar: false, children: [
    /* @__PURE__ */ jsxs(Head_default, { children: [
      /* @__PURE__ */ jsxs("title", { children: [
        status,
        " - ",
        info.title
      ] }),
      /* @__PURE__ */ jsx("meta", { name: "robots", content: "noindex" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center min-h-[60vh] text-center px-4", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-4", children: info.icon }),
      /* @__PURE__ */ jsx("p", { className: "text-7xl font-black text-slate-200 leading-none mb-4 select-none", children: status }),
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-slate-700 mb-2", children: info.title }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 mb-8 max-w-sm leading-relaxed", children: info.description }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: "/",
            className: "px-5 py-2.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition",
            children: "홈으로"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => window.history.back(),
            className: "px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-gray-200 rounded-lg hover:bg-slate-50 transition",
            children: "이전 페이지"
          }
        )
      ] })
    ] })
  ] });
}
const __vite_glob_0_6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: ErrorPage
}, Symbol.toStringTag, { value: "Module" }));
function InquiryComplete() {
  return /* @__PURE__ */ jsx(ServiceLayout, { children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-16 text-center", children: [
    /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx("svg", { className: "w-7 h-7 text-green-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2.5, d: "M5 13l4 4L19 7" }) }) }),
    /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold text-slate-800 mb-2", children: "문의가 접수되었습니다" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-6", children: "입력하신 이메일로 빠른 시일 내에 답변 드리겠습니다." }),
    /* @__PURE__ */ jsx(
      Link_default,
      {
        href: "/",
        className: "inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition",
        children: "홈으로 돌아가기"
      }
    )
  ] }) });
}
const __vite_glob_0_7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: InquiryComplete
}, Symbol.toStringTag, { value: "Module" }));
const TYPE_OPTIONS = [
  { value: "SUPPORT", label: "1:1 문의" },
  { value: "PARTNERSHIP", label: "제휴 문의" }
];
function InquiryForm({ type: initialType }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  const { data, setData, post, processing, errors } = useForm({
    type: initialType ?? "SUPPORT",
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    title: "",
    content: ""
  });
  function handleSubmit(e) {
    e.preventDefault();
    post("/inquiry");
  }
  return /* @__PURE__ */ jsxs(ServiceLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx(Link_default, { href: "/", className: "text-sm text-slate-400 hover:text-blue-500 transition", children: "홈" }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-300 text-sm", children: "›" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: "문의하기" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-4 border-b border-gray-100 bg-gray-50", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-base font-bold text-slate-800", children: "문의하기" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-0.5", children: "빠른 시일 내에 이메일로 답변 드리겠습니다." })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "px-6 py-5 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1.5", children: "문의 유형" }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-3", children: TYPE_OPTIONS.map((opt) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "radio",
                name: "type",
                value: opt.value,
                checked: data.type === opt.value,
                onChange: () => setData("type", opt.value),
                className: "accent-blue-600"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-700", children: opt.label })
          ] }, opt.value)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [
              "이름 ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.name,
                onChange: (e) => setData("name", e.target.value),
                placeholder: "홍길동",
                className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
              }
            ),
            errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [
              "이메일 ",
              /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                value: data.email,
                onChange: (e) => setData("email", e.target.value),
                placeholder: "example@email.com",
                className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
              }
            ),
            errors.email && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.email })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "연락처" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.phone,
              onChange: (e) => setData("phone", e.target.value),
              placeholder: "010-0000-0000 (선택)",
              className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [
            "제목 ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.title,
              onChange: (e) => setData("title", e.target.value),
              placeholder: "문의 제목을 입력해주세요",
              className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
            }
          ),
          errors.title && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.title })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: [
            "내용 ",
            /* @__PURE__ */ jsx("span", { className: "text-red-500", children: "*" })
          ] }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: data.content,
              onChange: (e) => setData("content", e.target.value),
              placeholder: "문의 내용을 자세히 입력해주세요.",
              rows: 7,
              className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition resize-none"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-1", children: [
            errors.content ? /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500", children: errors.content }) : /* @__PURE__ */ jsx("span", {}),
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400", children: [
              data.content.length,
              " / 5000"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "pt-1", children: /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            disabled: processing,
            className: "px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition",
            children: processing ? "제출 중..." : "문의 제출"
          }
        ) })
      ] })
    ] })
  ] });
}
const __vite_glob_0_8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: InquiryForm
}, Symbol.toStringTag, { value: "Module" }));
const BORDER_COLORS = [
  "border-blue-500",
  "border-emerald-500",
  "border-rose-500",
  "border-amber-500",
  "border-purple-500",
  "border-cyan-500"
];
const BADGE_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-cyan-100 text-cyan-700"
];
function BoardSection({ board, colorIndex = 0 }) {
  const posts = board.posts ?? [];
  const href = `/board/${board.category}`;
  const border = BORDER_COLORS[colorIndex % BORDER_COLORS.length];
  const badge = BADGE_COLORS[colorIndex % BADGE_COLORS.length];
  return /* @__PURE__ */ jsxs("section", { className: `bg-white rounded-lg shadow-sm border-l-4 ${border} overflow-hidden`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-b border-gray-100", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsx("span", { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`, children: board.board_name }) }),
      /* @__PURE__ */ jsx(
        Link_default,
        {
          href,
          className: "text-xs text-slate-400 hover:text-blue-500 transition font-medium",
          children: "전체보기 →"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("ul", { children: [
      posts.length === 0 && /* @__PURE__ */ jsx("li", { className: "px-4 py-5 text-center text-xs text-slate-400", children: "게시글이 없습니다." }),
      posts.map((post, i) => /* @__PURE__ */ jsx(
        "li",
        {
          className: `${i !== 0 ? "border-t border-gray-50" : ""}`,
          children: /* @__PURE__ */ jsxs(
            Link_default,
            {
              href: `/post/${post.post_id}`,
              className: "flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition group",
              children: [
                /* @__PURE__ */ jsx("span", { className: "shrink-0 w-5 text-center text-xs font-mono text-slate-300 group-hover:text-blue-400 transition", children: i + 1 }),
                post.is_notice && /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] font-bold text-white bg-red-500 rounded px-1 leading-tight", children: "공지" }),
                /* @__PURE__ */ jsxs("span", { className: "flex-1 text-sm text-slate-700 group-hover:text-blue-600 transition leading-snug min-w-0 truncate", children: [
                  post.title,
                  post.comment_count > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-blue-400 font-semibold text-xs", children: [
                    "+",
                    post.comment_count
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "shrink-0 flex items-center gap-2 text-[11px] text-slate-400 whitespace-nowrap", children: [
                  /* @__PURE__ */ jsxs("span", { className: "hidden md:flex items-center gap-1", children: [
                    /* @__PURE__ */ jsxs("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                      /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }),
                      /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" })
                    ] }),
                    fmtHits(post.hits)
                  ] }),
                  /* @__PURE__ */ jsx("span", { className: "text-slate-300 hidden md:block", children: "·" }),
                  /* @__PURE__ */ jsx("span", { children: timeAgo(post.created_at) })
                ] })
              ]
            }
          )
        },
        post.post_id
      ))
    ] })
  ] });
}
const GRADIENTS = [
  "bg-linear-to-br from-[#0f2642] to-[#1a3a5c]",
  "bg-linear-to-br from-slate-700 to-slate-500",
  "bg-linear-to-br from-emerald-800 to-emerald-600",
  "bg-linear-to-br from-rose-800 to-rose-600",
  "bg-linear-to-br from-violet-800 to-violet-600"
];
function RankBadge({ rank }) {
  const base = "shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-black";
  if (rank === 1) return /* @__PURE__ */ jsx("span", { className: `${base} bg-orange-500 text-white`, children: "1" });
  if (rank === 2) return /* @__PURE__ */ jsx("span", { className: `${base} bg-slate-400 text-white`, children: "2" });
  if (rank === 3) return /* @__PURE__ */ jsx("span", { className: `${base} bg-amber-600 text-white`, children: "3" });
  return /* @__PURE__ */ jsx("span", { className: `${base} bg-slate-200 text-slate-500`, children: rank });
}
function FeaturedCard({ post }) {
  return /* @__PURE__ */ jsxs(
    Link_default,
    {
      href: `/post/${post.post_id}`,
      className: "relative block w-full h-full rounded-xl overflow-hidden group shadow-sm",
      children: [
        post.thumbnail ? /* @__PURE__ */ jsx(
          "img",
          {
            src: post.thumbnail,
            alt: post.title,
            className: "absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105"
          }
        ) : /* @__PURE__ */ jsx("div", { className: `absolute inset-0 ${GRADIENTS[0]}` }),
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" }),
        /* @__PURE__ */ jsxs("div", { className: "absolute bottom-0 left-0 right-0 p-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [
            /* @__PURE__ */ jsx(RankBadge, { rank: 1 }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-white/70 bg-white/15 rounded px-2 py-0.5", children: post.board_name })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-sky-300 transition", children: post.title }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1.5 flex items-center gap-2 text-[11px] text-white/50", children: [
            /* @__PURE__ */ jsx("span", { children: post.author }),
            /* @__PURE__ */ jsx("span", { children: "·" }),
            /* @__PURE__ */ jsx("span", { children: timeAgo(post.created_at) }),
            post.comment_count > 0 && /* @__PURE__ */ jsxs(Fragment$1, { children: [
              /* @__PURE__ */ jsx("span", { children: "·" }),
              /* @__PURE__ */ jsxs("span", { className: "text-sky-400", children: [
                "댓글 ",
                post.comment_count
              ] })
            ] })
          ] })
        ] })
      ]
    }
  );
}
function SmallCard({ post, rank }) {
  const grad = GRADIENTS[rank - 1] ?? GRADIENTS[rank % GRADIENTS.length];
  return /* @__PURE__ */ jsxs(
    Link_default,
    {
      href: `/post/${post.post_id}`,
      className: "flex items-stretch h-16 rounded-lg overflow-hidden group shadow-sm bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md transition",
      children: [
        /* @__PURE__ */ jsx("div", { className: "relative shrink-0 w-24 overflow-hidden", children: post.thumbnail ? /* @__PURE__ */ jsx(
          "img",
          {
            src: post.thumbnail,
            alt: post.title,
            className: "absolute inset-0 w-full h-full object-cover transition duration-300 group-hover:scale-105"
          }
        ) : /* @__PURE__ */ jsx("div", { className: `absolute inset-0 ${grad} flex items-center justify-center`, children: /* @__PURE__ */ jsx("span", { className: "text-xl font-black text-white/25", children: rank }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col justify-center flex-1 min-w-0 px-3 py-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mb-1", children: [
            /* @__PURE__ */ jsx(RankBadge, { rank }),
            /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-400 truncate", children: post.board_name })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition leading-snug line-clamp-2", children: [
            post.title,
            post.comment_count > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-blue-400", children: [
              "[",
              post.comment_count,
              "]"
            ] })
          ] })
        ] })
      ]
    }
  );
}
function PopularWidget({ posts = [] }) {
  if (posts.length === 0) return null;
  const [first, ...rest] = posts;
  return /* @__PURE__ */ jsxs("section", { className: "mb-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-sm font-bold text-slate-700 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("span", { children: "🔥" }),
        " 인기글",
        /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-slate-400", children: "최근 7일" })
      ] }),
      /* @__PURE__ */ jsx(Link_default, { href: "/popular", className: "text-xs text-slate-400 hover:text-blue-500 transition font-medium", children: "전체보기 →" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "md:col-span-3 h-52 md:h-full flex", children: /* @__PURE__ */ jsx(FeaturedCard, { post: first }) }),
      /* @__PURE__ */ jsx("div", { className: "md:col-span-2 flex flex-col gap-2", children: rest.map((post, i) => /* @__PURE__ */ jsx(SmallCard, { post, rank: i + 2 }, post.post_id)) })
    ] })
  ] });
}
function MainIndex({ boards = [], popularPosts = [], seo = {} }) {
  const { props } = usePage();
  return /* @__PURE__ */ jsxs(ServiceLayout, { theme: "light", children: [
    /* @__PURE__ */ jsxs(Head_default, { children: [
      /* @__PURE__ */ jsx("title", { children: seo.title ?? "커뮤니티 포털" }),
      /* @__PURE__ */ jsx("meta", { name: "description", content: seo.description ?? "" }),
      /* @__PURE__ */ jsx("link", { rel: "canonical", href: seo.canonical ?? "" }),
      /* @__PURE__ */ jsx("meta", { property: "og:type", content: "website" }),
      /* @__PURE__ */ jsx("meta", { property: "og:title", content: seo.title ?? "커뮤니티 포털" }),
      /* @__PURE__ */ jsx("meta", { property: "og:description", content: seo.description ?? "" }),
      /* @__PURE__ */ jsx("meta", { property: "og:url", content: seo.canonical ?? "" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsx(PopularWidget, { posts: popularPosts }),
      boards.map((board, i) => /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(BoardSection, { board, colorIndex: i }) }, board.board_id))
    ] })
  ] });
}
const __vite_glob_0_9 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: MainIndex
}, Symbol.toStringTag, { value: "Module" }));
const ROW_SIZE = 3;
function Index({ boards = [] }) {
  const { auth, categoryBanners1 = [] } = usePage().props;
  const rows = [];
  for (let i = 0; i < boards.length; i += ROW_SIZE) {
    rows.push(boards.slice(i, i + ROW_SIZE));
  }
  return /* @__PURE__ */ jsxs(ServiceLayout, { theme: "dark", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-[#0d1b2a] rounded px-5 py-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-base font-bold text-white leading-snug", children: "커뮤니티에 오신 것을 환영합니다" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 mt-0.5", children: "다양한 주제의 게시판에서 자유롭게 소통하세요." })
      ] }),
      !auth?.user && /* @__PURE__ */ jsxs("div", { className: "flex gap-2 shrink-0", children: [
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: "/login",
            className: "text-sm px-4 py-2 rounded border border-white/20 text-white hover:bg-white/10 transition",
            children: "로그인"
          }
        ),
        /* @__PURE__ */ jsx(
          Link_default,
          {
            href: "/register",
            className: "text-sm px-4 py-2 rounded bg-sky-500 hover:bg-sky-400 text-white font-semibold transition",
            children: "회원가입"
          }
        )
      ] })
    ] }),
    boards.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-16 text-slate-400 text-sm bg-white rounded border border-gray-200", children: "등록된 게시판이 없습니다." }) : rows.map((row, ri) => /* @__PURE__ */ jsxs("div", { children: [
      ri > 0 && /* @__PURE__ */ jsx(
        BannerSlot,
        {
          banners: categoryBanners1,
          position: "MAIN_BOARD_CATEGORY"
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-4", children: row.map((board) => /* @__PURE__ */ jsx(BoardCard, { board }, board.board_id)) })
    ] }, ri))
  ] });
}
const __vite_glob_0_10 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index
}, Symbol.toStringTag, { value: "Module" }));
function SearchResult({ query, list }) {
  const [inputVal, setInputVal] = useState(query ?? "");
  const posts = list?.data ?? [];
  const meta = list?.meta ?? list ?? {};
  const lastPage = meta.last_page ?? 1;
  const curPage = meta.current_page ?? 1;
  const total = meta.total ?? 0;
  function goPage(page) {
    router3.get("/search", { q: query, page }, { preserveScroll: true });
  }
  function handleSearch(e) {
    e.preventDefault();
    if (!inputVal.trim()) return;
    router3.get("/search", { q: inputVal.trim() });
  }
  return /* @__PURE__ */ jsxs(ServiceLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx(Link_default, { href: "/", className: "text-sm text-slate-400 hover:text-blue-500 transition", children: "홈" }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-300 text-sm", children: "›" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: "통합검색" })
    ] }),
    /* @__PURE__ */ jsx("form", { onSubmit: handleSearch, className: "mb-5", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: inputVal,
          onChange: (e) => setInputVal(e.target.value),
          placeholder: "검색어를 입력하세요",
          className: "flex-1 px-4 py-2.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition",
          children: "검색"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-base font-bold text-slate-800", children: query ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsxs("span", { className: "text-blue-600", children: [
            '"',
            query,
            '"'
          ] }),
          " 검색 결과"
        ] }) : "통합검색" }),
        list && /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-400", children: [
          "전체 ",
          total,
          "건"
        ] })
      ] }),
      !query && /* @__PURE__ */ jsx("div", { className: "px-4 py-16 text-center text-sm text-slate-400", children: "검색어를 입력해주세요." }),
      query && posts.length === 0 && /* @__PURE__ */ jsxs("div", { className: "px-4 py-16 text-center text-sm text-slate-400", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium text-slate-500 mb-1", children: "검색 결과가 없습니다." }),
        /* @__PURE__ */ jsx("p", { children: "다른 검색어로 시도해 보세요." })
      ] }),
      posts.length > 0 && /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100", children: posts.map((post) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        Link_default,
        {
          href: `/post/${post.post_id}`,
          className: "flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition group",
          children: [
            /* @__PURE__ */ jsx("span", { className: "shrink-0 w-1.5 h-1.5 rounded-full bg-slate-200" }),
            /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap", children: post.board_name }),
            /* @__PURE__ */ jsxs("span", { className: "flex-1 text-sm text-slate-700 group-hover:text-blue-600 transition leading-snug truncate min-w-0", children: [
              post.title,
              post.has_image && /* @__PURE__ */ jsx("i", { className: "fa-regular fa-image ml-1 text-slate-400 text-[11px]" }),
              post.comment_count > 0 && /* @__PURE__ */ jsxs("span", { className: "ml-1 text-blue-400 font-semibold text-xs", children: [
                "[",
                post.comment_count,
                "]"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "shrink-0 flex items-center gap-2 text-[11px] text-slate-400 whitespace-nowrap", children: [
              /* @__PURE__ */ jsx("span", { className: "hidden sm:block max-w-[60px] truncate", children: post.author }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:block text-slate-300", children: "·" }),
              /* @__PURE__ */ jsxs("span", { className: "hidden sm:flex items-center gap-1", children: [
                /* @__PURE__ */ jsx("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }) }),
                fmtHits(post.hits)
              ] }),
              /* @__PURE__ */ jsx("span", { className: "text-slate-300 hidden sm:block", children: "·" }),
              /* @__PURE__ */ jsx("span", { children: timeAgo(post.created_at) })
            ] })
          ]
        }
      ) }, post.post_id)) }),
      /* @__PURE__ */ jsx(Pagination, { curPage, lastPage, onPageChange: goPage })
    ] })
  ] });
}
const __vite_glob_0_11 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: SearchResult
}, Symbol.toStringTag, { value: "Module" }));
function TabButton({ label, active, onClick }) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      onClick,
      className: `px-5 py-2.5 text-sm font-semibold border-b-2 transition ${active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`,
      children: label
    }
  );
}
function PostsTab({ posts }) {
  const items = posts?.data ?? [];
  const meta = posts?.meta ?? posts ?? {};
  const lastPage = meta.last_page ?? 1;
  const curPage = meta.current_page ?? 1;
  const total = meta.total ?? 0;
  function goPage(page) {
    router3.get("/mypage", { tab: "posts", page }, { preserveScroll: true });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between", children: /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500", children: [
      "전체 ",
      total,
      "건"
    ] }) }),
    items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-16 text-center text-sm text-slate-400", children: "작성한 게시글이 없습니다." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100", children: items.map((post) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
      Link_default,
      {
        href: `/post/${post.post_id}`,
        className: "flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition group",
        children: [
          /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] font-semibold text-white bg-blue-500 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap", children: post.board_name }),
          /* @__PURE__ */ jsx("span", { className: "flex-1 min-w-0 text-sm text-slate-700 group-hover:text-blue-600 transition truncate", children: post.title }),
          /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex items-center gap-2.5 text-xs text-slate-400 whitespace-nowrap", children: [
            post.comment_count > 0 && /* @__PURE__ */ jsxs("span", { className: "text-blue-400", children: [
              "[",
              post.comment_count,
              "]"
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "조회 ",
              post.hits
            ] }),
            /* @__PURE__ */ jsx("span", { children: timeAgo(post.created_at) })
          ] })
        ]
      }
    ) }, post.post_id)) }),
    /* @__PURE__ */ jsx(Pagination, { curPage, lastPage, onPageChange: goPage })
  ] });
}
function CommentsTab({ comments }) {
  const items = comments?.data ?? [];
  const meta = comments?.meta ?? comments ?? {};
  const lastPage = meta.last_page ?? 1;
  const curPage = meta.current_page ?? 1;
  const total = meta.total ?? 0;
  function goPage(page) {
    router3.get("/mypage", { tab: "comments", page }, { preserveScroll: true });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between", children: /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500", children: [
      "전체 ",
      total,
      "건"
    ] }) }),
    items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-16 text-center text-sm text-slate-400", children: "작성한 댓글이 없습니다." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100", children: items.map((c) => /* @__PURE__ */ jsxs("li", { className: "px-4 py-3 hover:bg-gray-50 transition", children: [
      /* @__PURE__ */ jsxs(
        Link_default,
        {
          href: `/post/${c.post_id}`,
          className: "flex items-center gap-2 mb-1.5",
          children: [
            /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] font-semibold text-white bg-slate-400 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap", children: c.board_name }),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 hover:text-blue-500 transition truncate", children: c.post_title })
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-700 leading-relaxed line-clamp-2", children: c.content }),
      /* @__PURE__ */ jsx("span", { className: "mt-1 block text-xs text-slate-400", children: timeAgo(c.created_at) })
    ] }, c.comment_id)) }),
    /* @__PURE__ */ jsx(Pagination, { curPage, lastPage, onPageChange: goPage })
  ] });
}
const TYPE_LABEL = { SUPPORT: "1:1 문의", PARTNERSHIP: "제휴 문의" };
const STATUS_META = {
  PENDING: { label: "대기중", cls: "bg-yellow-100 text-yellow-700" },
  ANSWERED: { label: "답변완료", cls: "bg-green-100 text-green-700" },
  CLOSED: { label: "종료", cls: "bg-gray-100 text-gray-500" }
};
function InquiryDetailModal({ id, onClose }) {
  const [detail, setDetail] = useState(null);
  useEffect(() => {
    axios.get(`/mypage/inquiry/${id}`).then((res) => setDetail(res.data));
  }, [id]);
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4", onClick: onClose, children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col",
      onClick: (e) => e.stopPropagation(),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-5 py-3.5 border-b border-gray-100 shrink-0", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800", children: "문의 상세" }),
          /* @__PURE__ */ jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600 transition", children: /* @__PURE__ */ jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M6 18L18 6M6 6l12 12" }) }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-y-auto flex-1 px-5 py-4 space-y-4", children: !detail ? /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 text-center py-8", children: "불러오는 중..." }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-white bg-slate-500 rounded px-1.5 py-0.5", children: TYPE_LABEL[detail.type] ?? detail.type }),
            (() => {
              const st = STATUS_META[detail.status] ?? { label: detail.status, cls: "bg-gray-100 text-gray-500" };
              return /* @__PURE__ */ jsx("span", { className: `text-[10px] font-semibold rounded px-1.5 py-0.5 ${st.cls}`, children: st.label });
            })(),
            /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: timeAgo(detail.created_at) })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-1", children: "제목" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-slate-800", children: detail.title })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-1", children: "문의 내용" }),
            /* @__PURE__ */ jsx("div", { className: "bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed", children: detail.content })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mb-1", children: "답변" }),
            detail.answer ? /* @__PURE__ */ jsx("div", { className: "bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed", children: detail.answer }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 italic", children: "아직 답변이 등록되지 않았습니다." }),
            detail.answered_at && /* @__PURE__ */ jsxs("p", { className: "mt-1 text-xs text-slate-400", children: [
              "답변일시: ",
              timeAgo(detail.answered_at)
            ] })
          ] })
        ] }) })
      ]
    }
  ) });
}
function InquiriesTab({ inquiries }) {
  const items = inquiries?.data ?? [];
  const meta = inquiries?.meta ?? inquiries ?? {};
  const lastPage = meta.last_page ?? 1;
  const curPage = meta.current_page ?? 1;
  const total = meta.total ?? 0;
  const [modalId, setModalId] = useState(null);
  function goPage(page) {
    router3.get("/mypage", { tab: "inquiries", page }, { preserveScroll: true });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500", children: [
        "전체 ",
        total,
        "건"
      ] }),
      /* @__PURE__ */ jsx(Link_default, { href: "/inquiry", className: "text-xs text-blue-500 hover:text-blue-700 transition font-medium", children: "+ 문의하기" })
    ] }),
    items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "py-16 text-center text-sm text-slate-400", children: [
      "문의 내역이 없습니다.",
      /* @__PURE__ */ jsx("div", { className: "mt-3", children: /* @__PURE__ */ jsx(Link_default, { href: "/inquiry", className: "text-blue-500 hover:text-blue-700 transition font-medium", children: "문의하기 →" }) })
    ] }) : /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100", children: items.map((inq) => {
      const st = STATUS_META[inq.status] ?? { label: inq.status, cls: "bg-gray-100 text-gray-500" };
      return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setModalId(inq.id),
          className: "w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition text-left",
          children: [
            /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] font-semibold text-white bg-slate-500 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap", children: TYPE_LABEL[inq.type] ?? inq.type }),
            /* @__PURE__ */ jsx("span", { className: "flex-1 min-w-0 text-sm text-slate-700 truncate", children: inq.title }),
            /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex items-center gap-2 whitespace-nowrap", children: [
              /* @__PURE__ */ jsx("span", { className: `text-[10px] font-semibold rounded px-1.5 py-0.5 leading-tight ${st.cls}`, children: st.label }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400", children: timeAgo(inq.created_at) })
            ] })
          ]
        }
      ) }, inq.id);
    }) }),
    /* @__PURE__ */ jsx(Pagination, { curPage, lastPage, onPageChange: goPage }),
    modalId && /* @__PURE__ */ jsx(InquiryDetailModal, { id: modalId, onClose: () => setModalId(null) })
  ] });
}
function PasswordTab() {
  const { data, setData, post, processing, errors, reset, recentlySuccessful } = useForm({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  function handleSubmit(e) {
    e.preventDefault();
    post("/mypage/password", {
      onSuccess: () => reset()
    });
  }
  return /* @__PURE__ */ jsx("div", { className: "px-5 py-6 max-w-md", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "현재 비밀번호" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "password",
          value: data.current_password,
          onChange: (e) => setData("current_password", e.target.value),
          autoComplete: "current-password",
          className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
        }
      ),
      errors.current_password && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.current_password })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "새 비밀번호" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "password",
          value: data.password,
          onChange: (e) => setData("password", e.target.value),
          autoComplete: "new-password",
          className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
        }
      ),
      errors.password && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-red-500", children: errors.password }),
      /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-slate-400", children: "최소 8자 이상" })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-slate-700 mb-1", children: "새 비밀번호 확인" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "password",
          value: data.password_confirmation,
          onChange: (e) => setData("password_confirmation", e.target.value),
          autoComplete: "new-password",
          className: "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pt-1", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: processing,
          className: "px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition",
          children: processing ? "변경 중..." : "비밀번호 변경"
        }
      ),
      recentlySuccessful && /* @__PURE__ */ jsx("span", { className: "text-sm text-green-600 font-medium", children: "변경되었습니다." })
    ] })
  ] }) });
}
function ScrapsTab({ scraps }) {
  const items = scraps?.data ?? [];
  const meta = scraps?.meta ?? scraps ?? {};
  const lastPage = meta.last_page ?? 1;
  const curPage = meta.current_page ?? 1;
  const total = meta.total ?? 0;
  function goPage(page) {
    router3.get("/mypage", { tab: "scraps", page }, { preserveScroll: true });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "px-4 py-2.5 border-b border-gray-100 bg-gray-50", children: /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500", children: [
      "전체 ",
      total,
      "건"
    ] }) }),
    items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-16 text-center text-sm text-slate-400", children: "스크랩한 게시글이 없습니다." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y divide-gray-100", children: items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
      Link_default,
      {
        href: `/post/${item.post_id}`,
        className: "flex items-center gap-3 px-4 py-3 hover:bg-amber-50 transition group",
        children: [
          /* @__PURE__ */ jsx("svg", { className: "shrink-0 w-3.5 h-3.5 text-amber-400", fill: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { d: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" }) }),
          /* @__PURE__ */ jsx("span", { className: "shrink-0 text-[10px] font-semibold text-white bg-amber-400 rounded px-1.5 py-0.5 leading-tight whitespace-nowrap", children: item.board_name }),
          /* @__PURE__ */ jsx("span", { className: "flex-1 min-w-0 text-sm text-slate-700 group-hover:text-amber-600 transition truncate", children: item.title }),
          /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex items-center gap-2.5 text-xs text-slate-400 whitespace-nowrap", children: [
            item.comment_count > 0 && /* @__PURE__ */ jsxs("span", { className: "text-amber-400", children: [
              "[",
              item.comment_count,
              "]"
            ] }),
            /* @__PURE__ */ jsx("span", { children: timeAgo(item.scrapped_at) })
          ] })
        ]
      }
    ) }, item.scrap_id)) }),
    /* @__PURE__ */ jsx(Pagination, { curPage, lastPage, onPageChange: goPage })
  ] });
}
function MyPage({ tab, posts, comments, inquiries, scraps }) {
  const { auth } = usePage().props;
  const user = auth?.user;
  function switchTab(newTab) {
    router3.get("/mypage", { tab: newTab, page: 1 }, { preserveScroll: true });
  }
  return /* @__PURE__ */ jsxs(ServiceLayout, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
      /* @__PURE__ */ jsx(Link_default, { href: "/", className: "text-sm text-slate-400 hover:text-blue-500 transition", children: "홈" }),
      /* @__PURE__ */ jsx("span", { className: "text-slate-300 text-sm", children: "›" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-slate-700", children: "마이페이지" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 px-5 py-4 mb-4 flex items-center gap-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white text-lg font-black shrink-0", children: user?.name?.[0]?.toUpperCase() ?? "?" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800", children: user?.name }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: user?.email })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex border-b border-gray-200 px-2", children: [
        /* @__PURE__ */ jsx(
          TabButton,
          {
            label: "내게시글",
            active: tab === "posts",
            onClick: () => switchTab("posts")
          }
        ),
        /* @__PURE__ */ jsx(
          TabButton,
          {
            label: "내댓글",
            active: tab === "comments",
            onClick: () => switchTab("comments")
          }
        ),
        /* @__PURE__ */ jsx(
          TabButton,
          {
            label: "내문의",
            active: tab === "inquiries",
            onClick: () => switchTab("inquiries")
          }
        ),
        /* @__PURE__ */ jsx(
          TabButton,
          {
            label: "스크랩",
            active: tab === "scraps",
            onClick: () => switchTab("scraps")
          }
        ),
        /* @__PURE__ */ jsx(
          TabButton,
          {
            label: "비밀번호 변경",
            active: tab === "password",
            onClick: () => switchTab("password")
          }
        )
      ] }),
      tab === "posts" && /* @__PURE__ */ jsx(PostsTab, { posts }),
      tab === "comments" && /* @__PURE__ */ jsx(CommentsTab, { comments }),
      tab === "inquiries" && /* @__PURE__ */ jsx(InquiriesTab, { inquiries }),
      tab === "scraps" && /* @__PURE__ */ jsx(ScrapsTab, { scraps }),
      tab === "password" && /* @__PURE__ */ jsx(PasswordTab, {})
    ] })
  ] });
}
const __vite_glob_0_12 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: MyPage
}, Symbol.toStringTag, { value: "Module" }));
createServer(
  (page) => createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    resolve: (name) => {
      const pages = /* @__PURE__ */ Object.assign({ "./Service/Pages/Auth/Login.jsx": __vite_glob_0_0, "./Service/Pages/Auth/Register.jsx": __vite_glob_0_1, "./Service/Pages/Board/BoardList.jsx": __vite_glob_0_2, "./Service/Pages/Board/PopularList.jsx": __vite_glob_0_3, "./Service/Pages/Board/PostDetail.jsx": __vite_glob_0_4, "./Service/Pages/Board/PostWrite.jsx": __vite_glob_0_5, "./Service/Pages/Errors/ErrorPage.jsx": __vite_glob_0_6, "./Service/Pages/Inquiry/InquiryComplete.jsx": __vite_glob_0_7, "./Service/Pages/Inquiry/InquiryForm.jsx": __vite_glob_0_8, "./Service/Pages/Main/Index.jsx": __vite_glob_0_9, "./Service/Pages/Preview/Index.jsx": __vite_glob_0_10, "./Service/Pages/Search/SearchResult.jsx": __vite_glob_0_11, "./Service/Pages/User/MyPage.jsx": __vite_glob_0_12 });
      return pages[`./Service/Pages/${name}.jsx`];
    },
    setup({ App: App2, props }) {
      return /* @__PURE__ */ jsx(App2, { ...props });
    }
  })
);
